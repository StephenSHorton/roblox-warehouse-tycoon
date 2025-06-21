import { BaseComponent, Component, Components } from "@flamework/components";
import { Dependency, OnStart } from "@flamework/core";
import { Workspace } from "@rbxts/services";

import { Box, BoxInstance } from "./Box";

interface BoxStorageInstance extends Model {
	RootPart: BasePart & {
		TakePrompt: ProximityPrompt;
	};
}

interface Attributes {}

@Component({
	tag: "BoxStorage",
})
export class BoxStorage extends BaseComponent<Attributes, BoxStorageInstance> implements OnStart {
	private boxDebounce: Array<BoxInstance> = [];
	private slots = new Map<Attachment, Box | false>();
	private disabled = false;

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

	public getBoxCount(): number {
		let count = 0;
		this.slots.forEach((box) => {
			if (box) count++;
		});
		return count;
	}

	/**
	 * Toggles the enabled state of the BoxStorage
	 * @param enabled Whether to enable or disable the BoxStorage
	 */
	public toggleEnabled(enabled: boolean) {
		if (enabled) {
			this.disabled = false;
			this.setTakePromptEnabled(enabled);
		} else {
			this.disabled = true;
			this.instance.RootPart.TakePrompt.Enabled = false;
		}
	}

	/**
	 * Occupies a slot in the BoxStorage, enabling the prompt to take a box from the BoxStorage
	 * @param slot The slot to occupy
	 */
	private occupySlot(slot: Attachment, box: Box) {
		this.slots.set(slot, box);
		this.setTakePromptEnabled(true);
	}

	private unoccupySlot(slot: Attachment) {
		this.slots.set(slot, false);

		// If there are still occupied slots, keep the prompt enabled
		if (this.getOccupiedSlot()) return;

		// Otherwise, disable the prompt
		this.setTakePromptEnabled(false);
	}

	/**
	 * Finds a free slot in the BoxStorage from the bottom up
	 * @returns The first free slot, or undefined if no slots are free
	 */
	private getFreeSlot(): Attachment | undefined {
		const freeSlots = [];
		for (const [attachment, box] of this.slots) {
			if (box) continue;
			freeSlots.push(attachment);
		}

		if (freeSlots.size() === 0) return undefined;

		// Sort the free slots by their position in the BoxStorage
		freeSlots.sort((a, b) => a.Position.Y < b.Position.Y);

		// Return the first free slot
		return freeSlots[0];
	}

	/**
	 * Finds an occupied slot in the BoxStorage from the top down
	 * @returns The first occupied slot, or undefined if no slots are occupied
	 */
	private getOccupiedSlot(): [Attachment, Box] | undefined {
		const occupiedSlots: Array<[Attachment, Box]> = [];
		for (const [attachment, box] of this.slots) {
			if (!box) continue;
			occupiedSlots.push([attachment, box]);
		}

		if (occupiedSlots.size() === 0) return undefined;

		// Sort the occupied slots by their position in the BoxStorage
		occupiedSlots.sort((a, b) => a[0].Position.Y > b[0].Position.Y);

		return occupiedSlots[0];
	}

	private setTakePromptEnabled(enabled: boolean) {
		if (this.disabled) return;
		this.instance.RootPart.TakePrompt.Enabled = enabled;
	}
}
