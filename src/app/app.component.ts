import { Component, ViewChild } from '@angular/core';
import { GameBoardComponent} from './game-board/game-board.component'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'ng-spread';
  @ViewChild(GameBoardComponent, {static: false}) gameboard: GameBoardComponent;

  onClickGo() {
    console.log("Go clicked!");

    this.gameboard.startProcess()
  }
}
