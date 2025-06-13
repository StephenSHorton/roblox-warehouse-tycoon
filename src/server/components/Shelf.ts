import { BaseComponent, Component, Components } from "@flamework/components";
import { Dependency, OnStart } from "@flamework/core";
import { Workspace } from "@rbxts/services";

import { Box, BoxInstance } from "./Box";

interface ShelfInstance extends Model {
	RootPart: BasePart & {
		TakePrompt: ProximityPrompt;
	};
}

interface Attributes {}

@Component({
	tag: "Shelf",
})
export class Shelf extends BaseComponent<Attributes, ShelfInstance> implements OnStart {
	private boxDebounce: Array<BoxInstance> = [];
	private slots = new Map<Attachment, Box | false>();

	onStart() {
		this.instance.RootPart.TakePrompt.Enabled = false;

		const attachments = this.instance.RootPart.GetChildren().filter((child) => child.IsA("Attachment"));
		for (const attachment of attachments) {
			this.slots.set(attachment, false);
		}

		// When a box is touched, it will be dropped and placed in the first free slot
		this.instance.RootPart.Touched.Connect((hit) => {
			const components = Dependency<Components>();
			const box = components.getComponent<Box>(hit);
			if (!box) return;

			if (this.boxDebounce.includes(box.instance)) return;

			const freeSlot = this.getFreeSlot();
			if (!freeSlot) return;

			this.boxDebounce.push(box.instance);

			box.drop();

			const offset = freeSlot.WorldCFrame.add(new Vector3(0, box.instance.Size.Y / 2, 0));

			const pickedUp = box.pickUp(this.instance.RootPart, offset);
			if (!pickedUp) return;

			box.instance.Parent = this.instance;

			this.occupySlot(freeSlot, box);

			task.delay(1, () => {
				this.boxDebounce = this.boxDebounce.filter((b) => b !== box.instance);
			});
		});

		this.instance.RootPart.TakePrompt.Triggered.Connect((player) => {
			const occupiedSlot = this.getOccupiedSlot();
			if (!occupiedSlot) return;

			const [slot, box] = occupiedSlot;

			box.drop();

			box.pickUpByPlayer(player);

			box.instance.Parent = Workspace;

			this.unoccupySlot(slot);
		});
	}

	/**
	 * Occupies a slot in the shelf, enabling the prompt to take a box from the shelf
	 * @param slot The slot to occupy
	 */
	private occupySlot(slot: Attachment, box: Box) {
		this.slots.set(slot, box);
		this.instance.RootPart.TakePrompt.Enabled = true;
	}

	private unoccupySlot(slot: Attachment) {
		this.slots.set(slot, false);

		// If there are still occupied slots, keep the prompt enabled
		if (this.getOccupiedSlot()) return;

		// Otherwise, disable the prompt
		this.instance.RootPart.TakePrompt.Enabled = false;
	}

	/**
	 * Finds a free slot in the shelf
	 * @returns The first free slot, or undefined if no slots are free
	 */
	private getFreeSlot(): Attachment | undefined {
		for (const [attachment, box] of this.slots) {
			if (box) continue;
			return attachment;
		}

		return undefined;
	}

	/**
	 * Finds an occupied slot in the shelf
	 * @returns The first occupied slot, or undefined if no slots are occupied
	 */
	private getOccupiedSlot(): [Attachment, Box] | undefined {
		for (const [attachment, box] of this.slots) {
			if (!box) continue;
			return [attachment, box];
		}
		return undefined;
	}
}
