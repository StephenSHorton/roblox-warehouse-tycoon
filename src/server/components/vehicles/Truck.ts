import { Component } from "@flamework/components";
import { OnStart } from "@flamework/core";

import { Vehicle, VehicleAttributes, VehicleInstance } from "./base/Vehicle";

interface TruckInstance extends VehicleInstance {
	Cabin: Model & {
		LeftHeadlight: Part & {
			SpotLight: SpotLight;
		};
		RightHeadlight: Part & {
			SpotLight: SpotLight;
		};
	};
}

interface Attributes extends VehicleAttributes {}

@Component({
	tag: "Truck",
})
export class Truck extends Vehicle<Attributes, TruckInstance> implements OnStart {
	protected STEER_ANGLE = 30;
	protected MAX_SPEED = 20;

	onStart() {
		super.onStart();

		const seat = this.instance.VehicleSeat;

		seat.GetPropertyChangedSignal("Occupant").Connect(() => {
			if (seat.Occupant) {
				this.playDrivingDecorations();
			} else {
				this.stopDrivingDecorations();
			}
		});
	}

	private playDrivingDecorations() {
		const leftLight = this.instance.Cabin.LeftHeadlight;
		const rightLight = this.instance.Cabin.RightHeadlight;

		leftLight.SpotLight.Enabled = true;
		rightLight.SpotLight.Enabled = true;

		leftLight.Material = Enum.Material.Neon;
		rightLight.Material = Enum.Material.Neon;
	}

	private stopDrivingDecorations() {
		const leftLight = this.instance.Cabin.LeftHeadlight;
		const rightLight = this.instance.Cabin.RightHeadlight;

		leftLight.SpotLight.Enabled = false;
		rightLight.SpotLight.Enabled = false;

		leftLight.Material = Enum.Material.SmoothPlastic;
		rightLight.Material = Enum.Material.SmoothPlastic;
	}
}
