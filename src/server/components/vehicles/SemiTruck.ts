import { Component, Components } from "@flamework/components";
import { Dependency, OnStart } from "@flamework/core";
import { Events } from "server/network";

import { PalletDetector, PalletDetectorInstance } from "../PalletDetector";
import { Vehicle, VehicleAttributes, VehicleInstance } from "./base/Vehicle";

interface SemiTruckInstance extends VehicleInstance {
	Pickup: Model & {
		Roof: Part & {
			PrismaticConstraint: PrismaticConstraint;
		};
	};
	PalletDetector1: PalletDetectorInstance;
	PalletDetector2: PalletDetectorInstance;
}

interface Attributes extends VehicleAttributes {}

@Component({
	tag: "SemiTruck",
})
export class SemiTruck extends Vehicle<Attributes, SemiTruckInstance> implements OnStart {
	protected STEER_ANGLE = 30;
	protected MAX_SPEED = 20;

	private heldPalletWelds: Map<Part, WeldConstraint> = new Map();
	private palletDetector1?: PalletDetector;
	private palletDetector2?: PalletDetector;

	onStart() {
		super.onStart();

		const components = Dependency<Components>();

		const detector1 = components.getComponent<PalletDetector>(this.instance.PalletDetector1);
		if (!detector1) {
			error("Failed to get PalletDetector1 component for SemiTruck");
		}
		this.palletDetector1 = detector1;

		const detector2 = components.getComponent<PalletDetector>(this.instance.PalletDetector2);
		if (!detector2) {
			error("Failed to get PalletDetector2 component for SemiTruck");
		}
		this.palletDetector2 = detector2;

		this.instance.PalletDetector1.Transparency = 1;
		this.instance.PalletDetector2.Transparency = 1;

		const seat = this.instance.VehicleSeat;

		seat.GetPropertyChangedSignal("Occupant").Connect(() => {
			if (!seat.Occupant) {
				this.setDoorDirection("neutral");
			}
		});

		Events.driverInput.connect((player, input, pressed) => {
			if (player !== this.occupant) return;

			let direction: Parameters<typeof this.setDoorDirection>[0] = "neutral";

			if (pressed) {
				switch (input) {
					case Enum.KeyCode.Q:
						direction = "down";
						break;
					case Enum.KeyCode.E:
						direction = "up";
						break;
					case Enum.KeyCode.F:
						this.palletDetector1?.tryLockPallet();
						this.palletDetector2?.tryLockPallet();
						break;
					case Enum.KeyCode.G:
						this.palletDetector1?.tryUnlockPallet();
						this.palletDetector2?.tryUnlockPallet();
						break;
				}
			}

			this.setDoorDirection(direction);
		});
	}

	private setDoorDirection(direction: "up" | "down" | "neutral") {
		const prismaticConstraint = this.instance.Pickup.Roof.PrismaticConstraint;

		if (direction === "up") {
			prismaticConstraint.TargetPosition = prismaticConstraint.UpperLimit;
		} else if (direction === "down") {
			prismaticConstraint.TargetPosition = prismaticConstraint.LowerLimit;
		} else {
			prismaticConstraint.TargetPosition = prismaticConstraint.CurrentPosition;
		}
	}
}
