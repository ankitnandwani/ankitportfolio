/**
 * In-memory double for the Supabase client.
 *
 * The knowledge base tables are simple enough to emulate faithfully for the
 * pipeline's needs: filtered selects, inserts, updates and deletes. This
 * lets the ingestion pipeline be exercised end to end without a live
 * database, which is what the CI environment has (PRD §104 asks for external
 * services to be mocked in CI).
 */

type Row = Record<string, unknown>;

interface QueryResult {
  data: unknown;
  error: { message: string } | null;
  count?: number | null;
}

/**
 * A stored row, as the fake tracks it.
 */
export interface FakeRow extends Row {
  id: string;
}

/**
 * Fluent query builder that mirrors the subset of the Supabase client the
 * ingestion pipeline uses.
 */
class FakeQuery implements PromiseLike<QueryResult> {
  private operation: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private payload: Row = {};
  private readonly filters: Array<[string, unknown]> = [];
  private readonly nullFilters: string[] = [];
  private countMode = false;
  private headOnly = false;
  private readonly store: FakeSupabase;
  private readonly table: string;

  constructor(store: FakeSupabase, table: string) {
    this.store = store;
    this.table = table;
  }

  select(
    _columns?: string,
    options?: { count?: string; head?: boolean }
  ): this {
    // `insert(...).select()` asks for the affected rows back. It must not
    // change the operation the builder was set up for.
    if (options?.count === 'exact') this.countMode = true;
    if (options?.head) this.headOnly = true;
    return this;
  }

  insert(values: Row): this {
    this.operation = 'insert';
    this.payload = values;
    return this;
  }

  update(values: Row): this {
    this.operation = 'update';
    this.payload = values;
    return this;
  }

  delete(): this {
    this.operation = 'delete';
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push([column, value]);
    return this;
  }

  is(column: string, value: unknown): this {
    if (value === null) {
      this.nullFilters.push(column);
    } else {
      this.filters.push([column, value]);
    }
    return this;
  }

  limit(): this {
    return this;
  }

  async single(): Promise<QueryResult> {
    const result = this.execute();
    const row = Array.isArray(result.data) ? result.data[0] : result.data;
    return { data: row ?? null, error: result.error };
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?:
      | ((value: QueryResult) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }

  private matches(row: Row): boolean {
    if (!this.filters.every(([column, value]) => row[column] === value)) {
      return false;
    }

    return this.nullFilters.every((column) => {
      const value = row[column];
      return value === null || value === undefined;
    });
  }

  private execute(): QueryResult {
    const rows = this.store.rowsFor(this.table);

    switch (this.operation) {
      case 'select': {
        const matching = rows.filter((row) => this.matches(row));

        if (this.countMode) {
          return {
            data: this.headOnly ? null : matching,
            error: null,
            count: matching.length,
          };
        }

        return { data: matching, error: null };
      }
      case 'insert': {
        const row: FakeRow = {
          ...this.payload,
          id: this.store.nextId(),
          created_at: new Date().toISOString(),
        };
        if (this.table === 'knowledge_documents') {
          row.updated_at = row.created_at;
        }
        rows.push(row);
        return { data: row, error: null };
      }
      case 'update': {
        const updated = rows.filter((row) => this.matches(row));
        for (const row of updated) {
          Object.assign(row, this.payload);
        }
        return { data: updated, error: null };
      }
      case 'delete': {
        const remaining = rows.filter((row) => !this.matches(row));
        rows.length = 0;
        rows.push(...remaining);
        return { data: null, error: null };
      }
    }
  }
}

/**
 * An in-memory stand-in for the knowledge base tables.
 */
export class FakeSupabase {
  /**
   * Rows in the knowledge_documents table.
   */
  readonly documents: FakeRow[] = [];

  /**
   * Rows in the knowledge_chunks table.
   */
  readonly chunks: FakeRow[] = [];

  private counter = 0;

  constructor(seed?: { documents?: Row[]; chunks?: Row[] }) {
    for (const document of seed?.documents ?? []) {
      this.documents.push({ ...document, id: this.nextId() } as FakeRow);
    }
    for (const chunk of seed?.chunks ?? []) {
      this.chunks.push({ ...chunk, id: this.nextId() } as FakeRow);
    }
  }

  /**
   * Generates a unique row id.
   */
  nextId(): string {
    this.counter += 1;
    return `00000000-0000-0000-0000-${String(this.counter).padStart(12, '0')}`;
  }

  /**
   * Returns the rows of a table.
   */
  rowsFor(table: string): FakeRow[] {
    return table === 'knowledge_documents' ? this.documents : this.chunks;
  }

  /**
   * Starts a query against a table.
   */
  from(table: string): FakeQuery {
    return new FakeQuery(this, table);
  }

  /**
   * Calls a database function.
   *
   * Only `match_knowledge_chunks` is implemented, because it is the only
   * function the knowledge base calls.
   */
  async rpc(
    name: string,
    params: Record<string, unknown>
  ): Promise<QueryResult> {
    if (name !== 'match_knowledge_chunks') {
      throw new Error(`the fake does not implement the function ${name}`);
    }

    const queryEmbedding = toVector(params.query_embedding);
    const matchCount = Number(params.match_count ?? 5);
    const threshold = Number(params.match_threshold ?? 0);
    const allowedClassifications =
      (params.allowed_classifications as string[] | null) ?? [
        'PUBLIC',
        'PROFESSIONAL',
      ];
    const allowedSourceTypes = params.allowed_source_types as string[] | null;

    const documentTypes = new Map(
      this.documents.map((document) => [
        document.id,
        document.source_type as string,
      ])
    );

    const matches = this.chunks
      .filter((chunk) => {
        if (chunk.embedding === null || chunk.embedding === undefined) {
          return false;
        }
        if (!allowedClassifications.includes(chunk.classification as string)) {
          return false;
        }
        if (allowedSourceTypes) {
          const sourceType = documentTypes.get(chunk.document_id as string);
          if (!sourceType || !allowedSourceTypes.includes(sourceType)) {
            return false;
          }
        }
        const similarity = cosineSimilarity(
          toVector(chunk.embedding),
          queryEmbedding
        );
        return similarity >= threshold;
      })
      .map((chunk) => {
        const similarity = cosineSimilarity(
          toVector(chunk.embedding),
          queryEmbedding
        );
        const metadata = (chunk.metadata ?? {}) as Record<string, unknown>;

        return {
          chunk_id: chunk.id,
          document_id: chunk.document_id,
          chunk_index: chunk.chunk_index,
          content: chunk.content,
          similarity,
          classification: chunk.classification,
          source_file:
            typeof metadata.source_file === 'string'
              ? metadata.source_file
              : null,
        };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, matchCount);

    return { data: matches, error: null };
  }
}

/**
 * Reads a vector that may be stored as an array or as the text form that
 * PostgREST returns.
 */
function toVector(value: unknown): number[] {
  if (Array.isArray(value)) return value as number[];

  if (typeof value === 'string') {
    return JSON.parse(value) as number[];
  }

  throw new Error('the value is not a vector');
}

/**
 * Cosine similarity between two vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let index = 0; index < a.length; index++) {
    dot += a[index] * b[index];
    magnitudeA += a[index] * a[index];
    magnitudeB += b[index] * b[index];
  }

  const denominator = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
  if (denominator === 0) return 0;

  return dot / denominator;
}
