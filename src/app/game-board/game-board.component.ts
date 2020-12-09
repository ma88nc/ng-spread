import { Component, OnInit, Input } from '@angular/core';
import { ViewChild } from '@angular/core';
import { CountdownComponent } from 'ngx-countdown';
import { ICell } from './Cell';
// import { CountdownModule } from 'ngx-countdown';

enum Direction {
  Stay = 1,
  Up,
  Down,
  Left,
  Right
}

@Component({
  selector: 'game-board',
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.css']
})
export class GameBoardComponent implements OnInit {
  @Input() width: number;
  @Input() height: number;
  @Input() percentPopulated: number;
  @Input() percentInfected: number;
  @Input() cycleDuration: number; // in msec

  board: number[][];
  LOW_RANGE: number = -50;
  HIGH_RANGE: number = 5;
  occupiedCells: ICell[] = [];
  cycle: number = 0;
  percentSelected: number = 10;
  statsTotalOccupied = 0;

  @ViewChild(CountdownComponent, {static: false}) counter: CountdownComponent;

  constructor() { 
   // this.initializeBoard();
  }

  ngOnInit() {
    this.initializeBoard();

    console.log('2,2 is ' + this.board[2][2])
  }

  initializeBoard() {
    // Initialize board to be empty
    this.board = [];
    for (var i: number=0; i < this.height; i++)
    {
      this.board[i] = [];
      for (var j: number=0; j < this.width; j++ )
      {
        this.board[i][j] = 0;
      }
     }

  //  console.log('2,2 is ' + this.board[2][2]);
  }

  displayCell(value: number) {
    if (value == 0) {
      return '-';
    }
    else {
        return '\u263a';
    }
  }

  // Set colors as follows:
  //      >0 : white      (unaffected)
  //       0 : light grey (empty)
  // -1..-50 : red        (infected)
  //    <-50 : green      (cured)
  getCellColor(value: number) {
    let color: string;
    switch (value)
    {
      case 0: 
        color = 'lightgrey';
        break;
      case 1: 
        color = '#FFA4A4';
        break;
      case 2:
        color = '#FFB6B6';
        break;
      case 3:
        color = '#FFC8C8';
        break;
      case 4:
        color = '#FFDBDB';
        break;
      case this.HIGH_RANGE:
        color = 'white';
        break;
    }
    // if (value == 0) {
    //   return 'lightgrey';
    // }
    // else if (value == this.HIGH_RANGE) {
    //   return 'white';      
    // }
    if (value < 0 && value >= this.LOW_RANGE)
    {
      color = 'red';
    }    
    else if (value < this.LOW_RANGE) {
      color = 'green';
    }  
    return color;
  }

  startProcess() {
    console.log("Here in startProcess!");
    let randx: number = 0;
    let randy: number = 0;
    let totalPopulation: number = Math.floor(this.height*this.width*this.percentPopulated/100);
    let totalInfected: number = Math.floor(totalPopulation * this.percentInfected/100);
    let totalNoninfected: number = totalPopulation - totalInfected;
    console.log(`total inf=${totalInfected}, total noninf=${totalNoninfected}, total pop=${totalPopulation}` )

    for (let x:number = 0; x < totalInfected; x++) {
      do {
        randx = this.getRandomNumberBetween(0,this.width-1);
        randy = this.getRandomNumberBetween(0,this.height-1);
      }
      while (this.board[randy][randx] != 0)
    
      this.board[randy][randx] = -1;
    }

    for (let x:number = 0; x < totalNoninfected; x++) {
      do {
        randx = this.getRandomNumberBetween(0,this.width-1);
        randy = this.getRandomNumberBetween(0,this.height-1);
      }
      while (this.board[randy][randx] != 0)
      this.board[randy][randx] = this.HIGH_RANGE;
    }

    this.cycle = 0;
    this.getOccupiedCells();
    this.calculateStatistics();
    this.counter.begin();
    
  }

  getRandomNumberBetween(min:number,max:number){
    return Math.floor(Math.random()*(max-min+1)+min);
}

handleTimerEvent(event) {
  console.log("Timer event "+ event.action);
 // if ((event.action == 'done') || (event.action == 'restart'))
 if (event.action == 'done')
  {
    console.log("Timer popped!");
    this.restarter();
  }
  
  //this.counter.restart();
  //this.counter.begin();
}

restarter() {
 // setTimeout(() => this.counter.restart());
 this.cycle++;
 setTimeout(() => { this.counter.restart(); this.counter.begin() } );

 this.ageAndResetCells();
 this.randomWalk();
 this.calculateStatistics();
}

getOccupiedCells() {
  for (var i: number=0; i < this.height; i++)
  {
    for (var j: number=0; j < this.width; j++)
    {
      // If occupied (non-zero), add to list of occupied cells
      if (this.board[i][j] != 0)
      {
        let cell: ICell = { x: i, y: j, isSelected: false };
        this.occupiedCells.push(cell);
      }
    }
  }
  console.log(this.occupiedCells);
}

// Iterate through array of occupied cells and "age" by decrementing value.
//   * Age uninfected cells that are adjacent to infected cells by decrementing value. If cell value=1, 
//         decrement again to -1 (infected) 
//   * Age infected cells
//   * DON'T age cured cells (value=LOW_RANGE)
// Also reset isProcessed flag to false.
ageAndResetCells()
{
  // console.log("Aging and resetting!");
  this.occupiedCells.forEach( (cell) =>
    {
      let value = this.board[cell.x][cell.y];
      let decValue = 1;
      if (value == this.LOW_RANGE-1)
      {
        decValue = 0;
      }
      else if (value == 1)
      {
        decValue = 2;
      }
      // console.log("ageAndResetCells x="+cell.x + " and y="+cell.y);
      // Decrement only if uninfected cell is adjacent to infected cell.
      if (value > 0 && this.isAdjacentToInfected(cell.x, cell.y) == false)
      {
        decValue = 0;
      }
      // Decrement the cell's value
      if (decValue != 0) {
        this.board[cell.x][cell.y] -= decValue;
      }

      // Reset isSelected flag
      cell.isSelected = false;
    }
  )
}

isAdjacentToInfected(x:number, y:number) : boolean {

  // let x: number = cell.x;
  // let y: number = cell.y;
  // console.log(`in isAdjacentToInfected with cell x=${x} and y=${y}`)

  // Check above
  if (x > 0 && this.isInfected(x-1, y))
  {
    return true;
  }
  // Check below
  if (x < this.height-1 && this.isInfected(x+1, y))
  {
    return true;
  }  
  // Check left
  if (y > 0 && this.isInfected(x, y-1))
  {
    return true;
  }
  // Check right
  if (y < this.width -1 && this.isInfected(x, y+1))
  {
    return true;
  }
  // console.log("in isAdjacentToInfected, returning false");
  return false;
}

isInfected(x:number, y:number): boolean {
//  console.log(`   in isInfected with cell x=${x} and y=${y}`);
  return this.board[x][y] > this.LOW_RANGE && this.board[x][y] < 0;
}

randomWalk() : void
{  
  let numOccupied = this.occupiedCells.length;
  let numToPick = Math.ceil(numOccupied * this.percentInfected / 100);
  console.log(`In random walk... will pick this many: ${numToPick}`);
  let count = 0;
  do {
    console.log(`Count is ${count}`);
    let rand = this.getRandomNumberBetween(0, numOccupied-1);
    if (!this.occupiedCells[rand].isSelected) {
      let randCell : ICell = this.occupiedCells[rand];
      randCell.isSelected = true;
      let x = randCell.x;
      let y = randCell.y;
      let randDirection = this.getRandomDirection(randCell);
      console.log(`   picked cell (${x}, ${y}) - moving ${randDirection} `);

      // If there is a valid move...
      if (randDirection != Direction.Stay) {
        let cellValue = this.board[x][y];
        // Clear the cell
        this.board[x][y] = 0;
        switch (randDirection) {
          case Direction.Up:
            x -= 1;
            break;
          case Direction.Down:
            x += 1;
            break;
          case Direction.Left:
            y -= 1;
            break;
          case Direction.Right:
            y += 1;
            break;            
        }

        // If cell is not infected and after the move is not adjacent to an
        // infected cell, set value back to max. Otherwise, keep the current value.
        if (cellValue > 0 && this.isAdjacentToInfected(x, y) == false)
        {
          this.board[x][y] = this.HIGH_RANGE;
        }
        else{
          this.board[x][y] = cellValue;
        }
        console.log(`    moving to (${x}, ${y})`)
        count++;
      }
    }
  } while (count < numToPick)

}

getRandomDirection(cell: ICell) : Direction {
  let x = cell.x;
  let y = cell.y;
  let choices = [];
  if (x > 0 && this.board[x-1][y] != 0)
  {
    choices.push(Direction.Up);
  }
  if (x < this.height-2 && this.board[x+1][y] != 0)
  {
    choices.push(Direction.Down);
  }
  if (y > 0 && this.board[x][y-1] != 0)
  {
    choices.push(Direction.Left);
  }
  if (y < this.width-2 && this.board[x][y+1] != 0)
  {
    choices.push(Direction.Right);
  }
  // If no valid choices, just stay put
  if (choices.length == 0)
  {
    return Direction.Stay;
  }
  // Only one choice, so return it
  if (choices.length == 1)
  {
    return choices[0];
  }
  
  // More than one choice. Pick one randomly.
  let rand = this.getRandomNumberBetween(0, choices.length-1);
  return choices[rand];
}

calculateStatistics() : void {
  this.statsTotalOccupied = 0;
  for (var i: number=0; i < this.height; i++)
  {
    for (var j: number=0; j < this.width; j++)
    {
      if (this.board[i][j] != 0) {
        this.statsTotalOccupied++;
      }
    }
  }
  console.log(`**********STATS: Total Occupied = ${this.statsTotalOccupied}`)
}

/*   getNonconflictingCoordinates(min:number,max:number) {
    let randx: number = this.getRandomNumberBetween(0,this.width-1);
    let randy: number = this.getRandomNumberBetween(0,this.height-1);
    return (this.board[randy][randx] != 0);    
  }   */
}
