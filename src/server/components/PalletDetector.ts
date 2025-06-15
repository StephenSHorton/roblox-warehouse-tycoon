import { BaseComponent, Component, Components } from "@flamework/components";
import { Dependency, OnStart } from "@flamework/core";
import { Workspace } from "@rbxts/services";

import { BoxStorage } from "./BoxStorage";

export interface PalletDetectorInstance extends Part {
	PalletWeldLocation: Attachment;
}

interface Attributes {}

@Component({
	tag: "PalletDetector",
})
export class PalletDetector extends BaseComponent<Attributes, PalletDetectorInstance> implements OnStart {
	private heldBoxStorage: BoxStorage | undefined;

	onStart() {
		this.instance.Transparency = 1;
	}

	tryLockPallet() {
		// Don't try to lock if there's already a weld
		if (this.heldBoxStorage?.instance.PrimaryPart?.GetChildren().some((child) => child.IsA("WeldConstraint")))
			return;

		const overlapParams = new OverlapParams();
		overlapParams.FilterType = Enum.RaycastFilterType.Exclude;
		overlapParams.FilterDescendantsInstances = [this.instance.Parent!];

		const parts = Workspace.GetPartBoundsInBox(this.instance.CFrame, this.instance.Size, overlapParams);

		if (parts.size() === 0) return warn("no parts found on pallet detector");

		let pallet: Model | undefined;
		for (const part of parts) {
			if (part.Parent?.Name !== "WoodenPallet") continue;
			pallet = part.Parent as Model;
		}

		if (!pallet) return warn("no pallet found");

		pallet.PivotTo(this.instance.PalletWeldLocation.WorldCFrame);

		const weld = new Instance("WeldConstraint");
		weld.Part0 = pallet.PrimaryPart;
		weld.Part1 = this.instance;
		weld.Parent = pallet.PrimaryPart;

		// Disable BoxStorage component if it exists
		const components = Dependency<Components>();
		const boxStorage = components.getComponent<BoxStorage>(pallet);
		if (boxStorage) {
			this.heldBoxStorage = boxStorage;
			boxStorage.toggleEnabled(false);
		}
	}

	tryUnlockPallet() {
		if (!this.heldBoxStorage) return;

		const weld = this.heldBoxStorage.instance.PrimaryPart?.GetChildren().find((child) =>
			child.IsA("WeldConstraint"),
		);
		if (weld) {
			weld.Destroy();
		}

		// Re-enable BoxStorage component
		this.heldBoxStorage.toggleEnabled(true);
		this.heldBoxStorage = undefined;
	}

	isLocked() {
		return (
			this.heldBoxStorage?.instance.PrimaryPart?.GetChildren().some((child) => child.IsA("WeldConstraint")) ??
			false
		);
	}
}
