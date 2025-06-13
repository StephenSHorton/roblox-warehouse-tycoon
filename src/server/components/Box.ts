import { BaseComponent, Component } from "@flamework/components";
import { OnStart } from "@flamework/core";
import Maid from "@rbxts/maid";
import { Events } from "server/network";

interface BoxInstance extends Part {
	PickUpPrompt: ProximityPrompt;
	DropPrompt: ProximityPrompt;
}

interface Attributes {}

@Component({
	tag: "Box",
})
export class Box extends BaseComponent<Attributes, BoxInstance> implements OnStart {
	private maid = new Maid();
	private currentWeld: WeldConstraint | undefined;

	onStart() {
		// Setup the box
		this.setup();
	}

	/**
	 * Picks up the box and welds it to the given part.
	 * @param weldTo The part to weld the box to.
	 * @param offset The offset to move the box to before welding it.
	 * @returns `true` if the box was picked up, `false` otherwise.
	 */
	public pickUp(weldTo: BasePart, offset: CFrame): boolean {
		// Check for an existing weld
		if (this.currentWeld) return false;

		// Disable the pick upprompt
		this.instance.PickUpPrompt.Enabled = false;
		this.instance.DropPrompt.Enabled = true;

		// Move the box to the weld position
		this.instance.PivotTo(offset);

		// Create the weld
		const weld = new Instance("WeldConstraint");
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
	 * Drops the box by removing the weld.
	 */
	public drop() {
		// Remove the weld
		this.currentWeld?.Destroy();
		this.currentWeld = undefined;

		// Re-enable the pick up prompt
		this.instance.PickUpPrompt.Enabled = true;
		this.instance.DropPrompt.Enabled = false;
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
				const character = player.Character;
				const upperTorso = character?.FindFirstChild("UpperTorso");
				if (!upperTorso || !upperTorso.IsA("BasePart")) return;

				const boxSizeOffset = this.instance.Size.Z / 2;
				const torsoSizeOffset = upperTorso.Size.Z / 2;
				const chestGapOffset = 0.2;
				const verticalOffset = new Vector3(0, -0.3, 0);
				const offset = upperTorso.CFrame.add(
					upperTorso.CFrame.LookVector.mul(boxSizeOffset + torsoSizeOffset + chestGapOffset).add(
						verticalOffset,
					),
				);

				const pickedUp = this.pickUp(upperTorso, offset);
				if (pickedUp) Events.playAnimation.fire(player, "Carry");
			}),
		);

		// Setup the drop prompt to trigger the drop function
		this.maid.GiveTask(
			this.instance.DropPrompt.Triggered.Connect((player) => {
				this.drop();
				Events.stopAnimation.fire(player);
			}),
		);
	}
}
