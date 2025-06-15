import { Component, Components } from "@flamework/components";
import { Dependency, OnStart } from "@flamework/core";
import { Events } from "server/network";

import { PalletDetector, PalletDetectorInstance } from "../PalletDetector";
import { Vehicle, VehicleAttributes, VehicleInstance } from "./base/Vehicle";

interface ForkLiftInstance extends VehicleInstance {
	Body: UnionOperation & {
		RightPrismaticConstraint: PrismaticConstraint;
	};
	PalletDetector: PalletDetectorInstance;
}

interface Attributes extends VehicleAttributes {}

@Component({
	tag: "ForkLift",
})
export class ForkLift extends Vehicle<Attributes, ForkLiftInstance> implements OnStart {
	protected STEER_ANGLE = 25;
	protected MAX_SPEED = 10;

	private palletDetector?: PalletDetector;

	onStart() {
		super.onStart();

		const components = Dependency<Components>();
		const detector = components.getComponent<PalletDetector>(this.instance.PalletDetector);

		if (!detector) {
			error("Failed to get PalletDetector component for ForkLift");
		}

		this.palletDetector = detector;

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
						direction = "down";
						break;
					case Enum.KeyCode.E:
						direction = "up";
						break;
					case Enum.KeyCode.F:
						this.palletDetector?.tryLockPallet();
						break;
					case Enum.KeyCode.G:
						print("unlocking pallet");
						this.palletDetector?.tryUnlockPallet();
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
}
