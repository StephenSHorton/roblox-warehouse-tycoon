import { OnStart, Service } from "@flamework/core";
import { DataStoreService, Players } from "@rbxts/services";

interface Leaderstats extends Folder {
	Money: IntValue;
}

@Service({})
export class EconomyService implements OnStart {
	onStart() {
		Players.PlayerAdded.Connect((player) => {
			const leaderstats = this.addPlayerLeaderstats(player);
			this.loadPlayerStats(player, leaderstats);
		});

		Players.PlayerRemoving.Connect((player) => {
			const leaderstats = this.getPlayerLeaderstats(player);
			if (!leaderstats) return;
			this.savePlayerStats(player, leaderstats);
		});
	}

	public addMoney(player: Player, amount: number) {
		const leaderstats = this.getPlayerLeaderstats(player);
		if (!leaderstats) return;
		leaderstats.Money.Value += amount;
	}

	private getPlayerLeaderstats(player: Player): Leaderstats {
		const leaderstats = player.FindFirstChild("leaderstats") as Leaderstats;
		return leaderstats;
	}

	private addPlayerLeaderstats(player: Player): Leaderstats {
		const leaderstats = new Instance("Folder");
		leaderstats.Name = "leaderstats";
		leaderstats.Parent = player;

		const money = new Instance("IntValue");
		money.Name = "Money";
		money.Value = 0;
		money.Parent = leaderstats;

		return leaderstats as Leaderstats;
	}

	private loadPlayerStats(player: Player, leaderstats: Leaderstats) {
		const store = DataStoreService.GetDataStore("Economy");
		const [playerData, _keyInfo] = store.GetAsync(tostring(player.UserId));
		if (!playerData) return;

		const data = playerData as { money: number };

		leaderstats.Money.Value = data.money;
	}

	private savePlayerStats(player: Player, leaderstats: Leaderstats) {
		const store = DataStoreService.GetDataStore("Economy");
		const data = { money: leaderstats.Money.Value };
		store.SetAsync(tostring(player.UserId), data);
	}
}
