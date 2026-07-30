import { PluginContext, PluginHandler, PluginParameters } from '../types';

export const handler: PluginHandler = async (
  context: PluginContext,
  parameters: PluginParameters
) => {
  let error = null;
  let verdict = false;
  let data = null;

  try {
    const kbuildUrl = parameters.kbuildUrl || 'http://localhost:8002';
    const projectId = context.metadata?.['x-project-id'] || 'default-project';

    const response = await fetch(`${kbuildUrl}/api/status`, {
      headers: {
        'x-project-id': projectId,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Kendra Bridge Connectivity Error: ${response.statusText}`
      );
    }

    const status: any = await response.json();

    context.metadata = {
      ...context.metadata,
      kbuild: {
        phase: status.phase,
        health: status.health,
        orchestration: status.workerStatus,
      },
    };

    if (status.health === 'Critical' || status.health === 'Paused') {
      verdict = false;
      error = new Error(
        `Autonomous Governance: AI request blocked. Project health is ${status.health}.`
      );
    } else {
      verdict = true;
      data = { message: 'Kendra Bridge context synchronized.', kbuild: status };
    }
  } catch (e: any) {
    error = e;
    verdict = false;
  }

  return { error, verdict, data };
};
