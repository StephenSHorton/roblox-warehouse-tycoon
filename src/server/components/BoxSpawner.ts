import { BaseComponent, Component } from "@flamework/components";
import { OnTick } from "@flamework/core";
import { Workspace } from "@rbxts/services";

import { Box } from "./Box";

interface BoxSpawnerInstance extends BasePart {}

interface Attributes {}

const SPAWN_INTERVAL = 2;

@Component({
	tag: "BoxSpawner",
})
export class BoxSpawner extends BaseComponent<Attributes, BoxSpawnerInstance> implements OnTick {
	private elapsedTime = 0;

	onTick(dt: number): void {
		this.elapsedTime += dt;
		if (this.elapsedTime < SPAWN_INTERVAL) return;
		this.elapsedTime = 0;

		const box = Box.create({ random: true });

		box.instance.CFrame = this.instance.CFrame;
		box.instance.Parent = Workspace;
	}
}
