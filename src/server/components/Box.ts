import { BaseComponent, Component, Components } from "@flamework/components";
import { Dependency, OnStart } from "@flamework/core";
import Maid from "@rbxts/maid";
import { ServerStorage } from "@rbxts/services";
import { Events } from "server/network";

export interface BoxInstance extends Part {
	PickUpPrompt: ProximityPrompt;
	DropPrompt: ProximityPrompt;
}

interface Attributes {}

const boxModel = ServerStorage.WaitForChild("Models").WaitForChild("Box") as BoxInstance;

@Component({
	tag: "Box",
})
export class Box extends BaseComponent<Attributes, BoxInstance> implements OnStart {
	public static tag = "Box";
	/** The available colors for boxes */
	public static colors = [
		new BrickColor("Bright red"),
		new BrickColor("Bright orange"),
		new BrickColor("Bright yellow"),
		new BrickColor("Bright green"),
		new BrickColor("Bright blue"),
		new BrickColor("Bright purple"),
	] as const;

	private maid = new Maid();
	private currentWeld: WeldConstraint | undefined;
	private playerCarrier: Player | undefined;

	onStart() {
		// Setup the box
		this.setup();
	}

	/**
	 * Creates a new box instance.
	 * @param options The options for the box.
	 * @param options.random If true, the box will have a random color and size.
	 * @returns The new Box.
	 */
	public static create(options?: { random?: boolean }): Box {
		const boxInstance = boxModel.Clone();

		const components = Dependency<Components>();
		const box = components.addComponent<Box>(boxInstance);
		if (!box) error("Box model is missing Box component");

		if (options?.random) {
			boxInstance.BrickColor = randomBoxColor();
			// boxInstance.Size = randomBoxSize();
		}

		return box;
	}

	/**
	 * Picks up the box and welds it to the given part.
	 * @param weldTo The part to weld the box to.
	 * @param offset The offset to move the box to before welding it.
	 * @returns `true` if the box was picked up, `false` otherwise.
	 */
	public pickUp(weldTo: BasePart, offset: CFrame): boolean {
		// Check for an existing weld
		const alreadyWelded = weldTo
			.GetChildren()
			.filter((child): child is WeldConstraint => child.IsA("WeldConstraint") && child.Name === "BoxWeld")
			.some((weld) => weld.Part0 === this.instance);

		if (this.currentWeld || alreadyWelded) return false;

		// Disable the pick upprompt
		this.instance.PickUpPrompt.Enabled = false;
		this.instance.DropPrompt.Enabled = true;

		// Move the box to the weld position
		this.instance.PivotTo(offset);

		// Create the weld
		const weld = new Instance("WeldConstraint");
		weld.Name = "BoxWeld";
		weld.Part0 = this.instance;
		weld.Part1 = weldTo;
		weld.Parent = weldTo;

		// Store it in the box instance
		this.currentWeld = weld;

		// Clean up the weld when the box is destroyed
		this.maid.GiveTask(weld);

		return true;
	}

	/**
	 * Picks up the box by the given player.
	 * @param player The player to pick up the box.
	 */
	public pickUpByPlayer(player: Player) {
		const character = player.Character;
		const upperTorso = character?.FindFirstChild("UpperTorso");
		if (!upperTorso || !upperTorso.IsA("BasePart")) return warn("No upper torso found");

		// Check if the player is already carrying a box
		const isCarryingBox =
			upperTorso
				.GetChildren()
				.filter((child): child is WeldConstraint => child.IsA("WeldConstraint") && child.Name === "BoxWeld")
				.size() > 0;
		if (isCarryingBox) return;

		const boxSizeOffset = this.instance.Size.Z / 2;
		const torsoSizeOffset = upperTorso.Size.Z / 2;
		const chestGapOffset = 0.2;
		const verticalOffset = new Vector3(0, -0.3, 0);
		const offset = upperTorso.CFrame.add(
			upperTorso.CFrame.LookVector.mul(boxSizeOffset + torsoSizeOffset + chestGapOffset).add(verticalOffset),
		);

		const pickedUp = this.pickUp(upperTorso, offset);
		if (pickedUp) {
			Events.playAnimation.fire(player, "Carry");
			this.playerCarrier = player;
		}
	}

	/**
	 * Drops the box by removing the weld.
	 */
	public drop() {
		// Stop the animation
		if (this.playerCarrier) Events.stopAnimation.fire(this.playerCarrier);

		// Remove the weld
		this.currentWeld?.Destroy();
		this.currentWeld = undefined;

		// Re-enable the pick up prompt
		this.instance.PickUpPrompt.Enabled = true;
		this.instance.DropPrompt.Enabled = false;

		// Reset the player carrier
		this.playerCarrier = undefined;
	}

	/**
	 * Sets up the box.
	 */
	private setup() {
		// Task the maid with cleaning up when the box is destroyed
		this.instance.Destroying.Connect(() => {
			this.maid.DoCleaning();
		});

		// Setup the pick up prompt to trigger the pick up function
		this.maid.GiveTask(
			this.instance.PickUpPrompt.Triggered.Connect((player) => {
				this.pickUpByPlayer(player);
			}),
		);

		// Setup the drop prompt to trigger the drop function
		this.maid.GiveTask(
			this.instance.DropPrompt.Triggered.Connect((player) => {
				if (this.playerCarrier !== player) return;
				this.drop();
			}),
		);
	}
}

function randomBoxColor(): BrickColor {
	return Box.colors[math.random(1, Box.colors.size()) - 1];
}

// function randomBoxSize(): Vector3 {
// 	return new Vector3(math.random(2, 3), math.random(2, 3), math.random(2, 3));
// }
