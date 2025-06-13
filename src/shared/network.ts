import { Networking } from "@flamework/networking";

interface ClientToServerEvents {
	dropBox: () => void;
}

interface ServerToClientEvents {
	playAnimation: (animationTag: CustomAnimationTag) => void;
	stopAnimation: () => void;
}

interface ClientToServerFunctions {}

interface ServerToClientFunctions {}

export const GlobalEvents = Networking.createEvent<ClientToServerEvents, ServerToClientEvents>();
export const GlobalFunctions = Networking.createFunction<ClientToServerFunctions, ServerToClientFunctions>();
