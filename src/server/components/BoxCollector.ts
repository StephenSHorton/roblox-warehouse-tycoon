import { BaseComponent, Component, Components } from "@flamework/components";
import { Dependency, OnStart } from "@flamework/core";
import { Players, TweenService } from "@rbxts/services";
import { EconomyService } from "server/services/EconomyService";

import { Box } from "./Box";
import { BoxStorage } from "./BoxStorage";

interface BoxCollectorInstance extends Part {}

interface Attributes {}

@Component({
	tag: "BoxCollector",
})
export class BoxCollector extends BaseComponent<Attributes, BoxCollectorInstance> implements OnStart {
	constructor(private readonly economyService: EconomyService) {
		super();
	}

	onStart() {
		this.instance.Touched.Connect((hit) => {
			const components = Dependency<Components>();
			const box = components.getComponent<Box>(hit);
			if (box) {
				return this.handleBox(box);
			}

			if (hit.Parent?.Name !== "WoodenPallet") return;
			const boxStorage = components.getComponent<BoxStorage>(hit.Parent);
			if (boxStorage) {
				return this.handlePallet(boxStorage);
			}
		});
	}

	private handleBox(box: Box) {
		this.ghostifyDelete(box.instance);
		const player = Players.GetPlayers().find((player) => player.FindFirstChild("leaderstats") !== undefined);
		if (!player) return;
		this.economyService.addMoney(player, 10);
	}

	private handlePallet(boxStorage: BoxStorage) {
		const boxCount = boxStorage.getBoxCount();

		this.ghostifyDelete(boxStorage.instance);
		const player = Players.GetPlayers().find((player) => player.FindFirstChild("leaderstats") !== undefined);
		if (!player) return;
		this.economyService.addMoney(player, 10 * boxCount);
	}

	private ghostifyDelete(instance: Instance) {
		for (const child of instance.GetChildren()) {
			if (child.IsA("BasePart")) {
				child.Anchored = true;
				child.CanCollide = false;
				const tween = TweenService.Create(child, new TweenInfo(2), {
					Transparency: 1,
					Position: this.instance.Position,
				});
				tween.Completed.Connect(() => {
					child.Destroy();
				});
				tween.Play();
			}
		}

		if (!instance.IsA("BasePart")) return;
		instance.Anchored = true;
		instance.CanCollide = false;
		const tween = TweenService.Create(instance, new TweenInfo(2), {
			Transparency: 1,
			Position: this.instance.Position,
		});
		tween.Completed.Connect(() => {
			instance.Destroy();
		});
		tween.Play();
	}
}
