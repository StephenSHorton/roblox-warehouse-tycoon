import { Controller, OnStart } from "@flamework/core";
import { UserInputService } from "@rbxts/services";
import { Events } from "client/network";

@Controller({})
export class VehicleControl implements OnStart {
	private isDriving = false;

	onStart() {
		Events.toggleDriving.connect((isDriving) => {
			this.isDriving = isDriving;
		});

		UserInputService.InputBegan.Connect((input, gameProcessedEvent) => {
			if (!this.isDriving) return;

			if (gameProcessedEvent) return;

			switch (input.KeyCode) {
				case Enum.KeyCode.Q:
					Events.driverInput.fire(input.KeyCode, true);
					break;
				case Enum.KeyCode.E:
					Events.driverInput.fire(input.KeyCode, true);
					break;
				case Enum.KeyCode.F:
					Events.driverInput.fire(input.KeyCode, true);
					break;
			}
		});

		UserInputService.InputEnded.Connect((input, gameProcessedEvent) => {
			if (!this.isDriving) return;

			if (gameProcessedEvent) return;

			switch (input.KeyCode) {
				case Enum.KeyCode.Q:
					Events.driverInput.fire(input.KeyCode, false);
					break;
				case Enum.KeyCode.E:
					Events.driverInput.fire(input.KeyCode, false);
					break;
				case Enum.KeyCode.F:
					Events.driverInput.fire(input.KeyCode, false);
					break;
			}
		});
	}
}
