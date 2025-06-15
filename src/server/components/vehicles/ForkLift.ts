import { Component } from "@flamework/components";
import { OnStart } from "@flamework/core";
import { Workspace } from "@rbxts/services";
import { Events } from "server/network";

import { Vehicle, VehicleAttributes, VehicleInstance } from "./base/Vehicle";

interface ForkLiftInstance extends VehicleInstance {
	Body: UnionOperation & {
		RightPrismaticConstraint: PrismaticConstraint;
	};
	PalletDetector: Part & {
		PalletWeldLocation: Attachment;
	};
}

interface Attributes extends VehicleAttributes {}

@Component({
	tag: "ForkLift",
})
export class ForkLift extends Vehicle<Attributes, ForkLiftInstance> implements OnStart {
	protected STEER_ANGLE = 25;
	protected MAX_SPEED = 10;

	private heldPalletWeld: WeldConstraint | undefined;

	onStart() {
		super.onStart();

		this.instance.PalletDetector.Transparency = 1;

		const seat = this.instance.VehicleSeat;

		seat.GetPropertyChangedSignal("Occupant").Connect(() => {
			if (!seat.Occupant) {
				this.setForkDirection("neutral");
			}
		});

		Events.driverInput.connect((player, input, pressed) => {
			if (player !== this.occupant) return;

			let direction: Parameters<typeof this.setForkDirection>[0] = "neutral";

			if (pressed) {
				switch (input) {
					case Enum.KeyCode.Q:
						direction = "up";
						break;
					case Enum.KeyCode.E:
						direction = "down";
						break;
					case Enum.KeyCode.F:
						this.toggleLockNearbyPallet();
						break;
				}
			}

			this.setForkDirection(direction);
		});
	}

	private setForkDirection(direction: "up" | "down" | "neutral") {
		const rightConstraint = this.instance.Body.RightPrismaticConstraint;

		if (direction === "up") {
			rightConstraint.TargetPosition = rightConstraint.UpperLimit;
		} else if (direction === "down") {
			rightConstraint.TargetPosition = rightConstraint.LowerLimit;
		} else {
			rightConstraint.TargetPosition = rightConstraint.CurrentPosition;
		}
	}

	private toggleLockNearbyPallet() {
		if (this.heldPalletWeld) {
			this.heldPalletWeld.Destroy();
			this.heldPalletWeld = undefined;
			return;
		}

		const palletDetector = this.instance.PalletDetector;

		const overlapParams = new OverlapParams();
		overlapParams.FilterType = Enum.RaycastFilterType.Exclude;
		overlapParams.FilterDescendantsInstances = [this.instance];

		const parts = Workspace.GetPartBoundsInBox(palletDetector.CFrame, palletDetector.Size, overlapParams);

		if (parts.size() === 0) return warn("no parts found on pallet detector");

		let pallet: Model | undefined;
		for (const part of parts) {
			if (part.Parent?.Name !== "WoodenPallet") continue;
			pallet = part.Parent as Model;
		}

		if (!pallet) return warn("no pallet found");

		pallet.PivotTo(palletDetector.PalletWeldLocation.WorldCFrame);

		const weld = new Instance("WeldConstraint");
		weld.Part0 = pallet.PrimaryPart;
		weld.Part1 = palletDetector;
		weld.Parent = pallet.PrimaryPart;

		this.heldPalletWeld = weld;
	}
}
