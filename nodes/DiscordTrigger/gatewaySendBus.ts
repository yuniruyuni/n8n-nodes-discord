// Module-level registry for routing Discord Gateway send commands from
// action nodes (e.g. DiscordGatewayCommand) to the WebSocket owned by a
// DiscordTrigger node running in the same Node process.
//
// Limitation: state lives in process memory. It works when Trigger and
// Action execute in the same Node process (typical self-hosted n8n), but
// will NOT work across n8n workers / Cloud distributed runners where the
// Action may run in a different process than the Trigger.

export type GatewaySender = (payload: { op: number; d: unknown }) => void;

const registry = new Map<string, GatewaySender>();

export function registerGatewaySender(name: string, send: GatewaySender): void {
	registry.set(name, send);
}

export function unregisterGatewaySender(name: string): void {
	registry.delete(name);
}

export function getGatewaySender(name: string): GatewaySender | undefined {
	return registry.get(name);
}

export function listGatewaySenders(): string[] {
	return Array.from(registry.keys());
}
