import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'mx-grid-actions',
  templateUrl: './grid-actions.component.html',
  styleUrls: ['./grid-actions.component.css']
})
export class GridActionsComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    if (this.groups.length > 0){
      this.selectedGrouping = this.groups[0];
    }
  }
  
  @Input()
  groups : string[];

  filterCriteria : string;

  selectedGrouping : string = "";

  
  @Output()
  onGroupingChanged = new EventEmitter<string>();

  @Output()
  onFilterChanged = new EventEmitter<string>();

  onFilter() {
    if (this.filterCriteria.length > 0 && this.filterCriteria.length < 3)
      return;

    this.onFilterChanged.emit(this.filterCriteria);
  }

  onGroupingChange(grouping: string) {
    this.selectedGrouping = grouping;
    this.onGroupingChanged.emit(grouping);
  }
}
