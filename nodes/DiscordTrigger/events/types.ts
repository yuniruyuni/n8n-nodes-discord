export interface DiscordEventMeta {
	name: string;
	displayName: string;
	description: string;
	requiredIntent?: number;
	privileged?: boolean;
}
