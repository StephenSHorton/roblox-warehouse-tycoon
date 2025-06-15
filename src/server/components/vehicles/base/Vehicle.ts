import { BaseComponent, Component } from "@flamework/components";
import { OnStart } from "@flamework/core";
import { Players } from "@rbxts/services";
import { Events } from "server/network";

export interface VehicleInstance extends Model {
	VehicleSeat: VehicleSeat;
	FrontLeft: Model & {
		PartA: Part & {
			HingeConstraint: HingeConstraint;
		};
		Wheel: Part & {
			HingeConstraint: HingeConstraint;
		};
	};
	FrontRight: Model & {
		PartA: Part & {
			HingeConstraint: HingeConstraint;
		};
		Wheel: Part & {
			HingeConstraint: HingeConstraint;
		};
	};
	BackLeft: Model & {
		Wheel: Part & {
			HingeConstraint: HingeConstraint;
		};
	};
	BackRight: Model & {
		Wheel: Part & {
			HingeConstraint: HingeConstraint;
		};
	};
}

export interface VehicleAttributes {}

@Component({
	tag: "Vehicle",
})
export abstract class Vehicle<
		A extends VehicleAttributes = VehicleAttributes,
		I extends VehicleInstance = VehicleInstance,
	>
	extends BaseComponent<A, I>
	implements OnStart
{
	protected occupant: Player | undefined;

	protected STEER_ANGLE = 30;
	protected MAX_SPEED = 30;

	onStart() {
		const seat = this.instance.VehicleSeat;

		seat.GetPropertyChangedSignal("Occupant").Connect(() => {
			if (!seat.Occupant) {
				if (!this.occupant) return;

				Events.toggleDriving.fire(this.occupant, false);
				this.occupant = undefined;
				return;
			}

			const player = Players.GetPlayerFromCharacter(seat.Occupant.Parent);
			if (!player) return;

			Events.toggleDriving.fire(player, true);
			this.occupant = player;
		});

		seat.GetPropertyChangedSignal("Steer").Connect(() => {
			this.instance.FrontLeft.PartA.HingeConstraint.TargetAngle = seat.Steer * this.STEER_ANGLE;
			this.instance.FrontRight.PartA.HingeConstraint.TargetAngle = seat.Steer * this.STEER_ANGLE;
		});

		seat.GetPropertyChangedSignal("Throttle").Connect(() => {
			const speed = seat.Throttle * this.MAX_SPEED;

			this.instance.FrontLeft.Wheel.HingeConstraint.AngularVelocity = speed;
			this.instance.FrontRight.Wheel.HingeConstraint.AngularVelocity = -speed;

			this.instance.BackLeft.Wheel.HingeConstraint.AngularVelocity = speed;
			this.instance.BackRight.Wheel.HingeConstraint.AngularVelocity = -speed;
		});
	}
}
