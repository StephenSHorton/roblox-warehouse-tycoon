import { Networking } from "@flamework/networking";

interface ClientToServerEvents {
	dropBox: () => void;

	//* ------------------------------- VehicleControl.ts
	/** Sends a key input to the server */
	driverInput: (input: Enum.KeyCode, pressed: boolean) => void;
}

interface ServerToClientEvents {
	//* ------------------------------- AnimationControl.ts
	/** Plays an animation on the player */
	playAnimation: (animationTag: CustomAnimationTag) => void;
	/** Stops the current animation on the player */
	stopAnimation: () => void;

	//* ------------------------------- VehicleControl.ts
	/** Indicates to the client that the player has started or stopped driving */
	toggleDriving: (isDriving: boolean) => void;
}

interface ClientToServerFunctions {}

interface ServerToClientFunctions {}

export const GlobalEvents = Networking.createEvent<ClientToServerEvents, ServerToClientEvents>();
export const GlobalFunctions = Networking.createFunction<ClientToServerFunctions, ServerToClientFunctions>();
