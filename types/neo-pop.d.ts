import type { Button as NeoButtonFromLib } from '@cred/neopop-web/lib';
import type { ElevatedCard as NeoElevatedCardFromLib } from '@cred/neopop-web/lib/esm/components/ElevatedCard';
import type { Tag as NeoTagFromLib } from '@cred/neopop-web/lib/esm/components/Tags';

declare module '@cred/neopop-web' {
  const Component: typeof NeoButtonFromLib;
  export default Component;
}

declare module '@cred/neopop-web/lib-esm/components/Button' {
  const Component: typeof NeoButtonFromLib;
  export default Component;
}

declare module '@cred/neopop-web/lib-esm/components/ElevatedCard' {
  const Component: typeof NeoElevatedCardFromLib;
  export default Component;
}

declare module '@cred/neopop-web/lib-esm/components/Tags' {
  const Component: typeof NeoTagFromLib;
  export default Component;
}