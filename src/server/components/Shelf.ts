import { BaseComponent, Component, Components } from "@flamework/components";
import { Dependency, OnStart } from "@flamework/core";

import { Box } from "./Box";

interface ShelfInstance extends Model {
	RootPart: BasePart;
}

interface Attributes {}

@Component({
	tag: "Shelf",
})
export class Shelf extends BaseComponent<Attributes, ShelfInstance> implements OnStart {
	private debounce = false;
	private slots = new Map<Attachment, boolean>();

	onStart() {
		const attachments = this.instance.RootPart.GetChildren().filter((child) => child.IsA("Attachment"));
		for (const attachment of attachments) {
			this.slots.set(attachment, false);
		}

		// When a box is touched, it will be dropped and placed in the first free slot
		this.instance.RootPart.Touched.Connect((hit) => {
			if (this.debounce) return;

			const components = Dependency<Components>();
			const box = components.getComponent<Box>(hit);
			if (!box) return;

			const freeSlot = this.getFreeSlot();
			if (!freeSlot) return;

			this.debounce = true;

			box.drop();

			const offset = freeSlot.WorldCFrame.add(new Vector3(0, box.instance.Size.Y / 2, 0));

			const pickedUp = box.pickUp(this.instance.RootPart, offset);
			if (!pickedUp) return;

			this.slots.set(freeSlot, true);

			task.delay(0.1, () => {
				this.debounce = false;
			});
		});
	}

	/**
	 * Finds a free slot in the shelf
	 * @returns The first free slot, or undefined if no slots are free
	 */
	private getFreeSlot(): Attachment | undefined {
		for (const [attachment, isOccupied] of this.slots) {
			if (isOccupied) continue;
			return attachment;
		}
		return undefined;
	}
}
