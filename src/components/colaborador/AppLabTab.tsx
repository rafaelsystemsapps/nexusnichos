import { AppLabWorkspace } from "./applab/AppLabWorkspace";

interface AppLabTabProps {
  nichoId: string;
}

export function AppLabTab({ nichoId }: AppLabTabProps) {
  return <AppLabWorkspace nichoId={nichoId} />;
}
