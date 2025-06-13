import { Controller, OnStart } from "@flamework/core";
import { Players } from "@rbxts/services";
import { Events } from "client/network";

@Controller({})
export class AnimationControl implements OnStart {
	private currentAnimationTrack: AnimationTrack | undefined;

	onStart() {
		const player = Players.LocalPlayer;
		const character = player.Character || player.CharacterAdded.Wait()[0];
		const humanoid = character.FindFirstChildOfClass("Humanoid");
		const animator = humanoid?.FindFirstChildOfClass("Animator");

		if (!animator) return;

		const animation = new Instance("Animation");
		animation.Name = "Idle";
		animation.AnimationId = "rbxassetid://120602140833706";
		animation.Parent = animator;

		const carryAnimation = animator.LoadAnimation(animation);

		Events.playAnimation.connect((animationTag) => {
			switch (animationTag) {
				case "Carry":
					this.currentAnimationTrack = carryAnimation;
					break;
			}

			this.currentAnimationTrack.Play();
		});

		Events.stopAnimation.connect(() => {
			this.currentAnimationTrack?.Stop();
			this.currentAnimationTrack = undefined;
		});
	}
}
