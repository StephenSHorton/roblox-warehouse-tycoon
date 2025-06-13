import { BaseComponent, Component } from "@flamework/components";
import { OnStart } from "@flamework/core";

interface ConveyorBeltInstance extends BasePart {
	Beam: Beam;
}

interface Attributes {}

@Component({
	tag: "ConveyorBelt",
})
export class ConveyorBelt extends BaseComponent<Attributes, ConveyorBeltInstance> implements OnStart {
	onStart(): void {
		this.instance.AssemblyLinearVelocity = this.instance.CFrame.LookVector.mul(this.instance.Beam.TextureSpeed * 5);
	}
}
