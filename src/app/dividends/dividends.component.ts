import { Component, Input, AfterViewInit, ViewChild } from '@angular/core';
import { StockmonService } from '../stockmon.service';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Dividend } from '../viewModel/dividend';

@Component({
  selector: 'mx-dividends',
  templateUrl: './dividends.component.html',
  styleUrls: ['./dividends.component.css']
})
export class DividendsComponent implements AfterViewInit {
  private _accountId: number = -1;
  private _year: number = -1;

  private _viewLoaded: boolean = false;

  gridData: MatTableDataSource<Dividend>;

  gridColumns = [
    'date',
    'stock',
    'amount',
    'notes'
  ];

  filterCriteria: string = '';
  summaryKPIs: any = {};


  @ViewChild(MatSort) sort: MatSort;

  constructor(private stockService: StockmonService) { }

  ngAfterViewInit(): void {
    this._viewLoaded = true;

    this.refreshGrid();
  }


  @Input()
  set accountId(id: number) {
    this._accountId = id;

    if (!this._viewLoaded) {
      return;
    }

    this.refreshGrid();
  }

  @Input()
  set year(year: number) {
    this._year = year;
    if (!this._viewLoaded) {
      return;
    }

    this.refreshGrid();
  }

  refreshGrid() {
    this.stockService.getDividends(this._accountId, this._year).then((dividends) => {
      this.gridData = new MatTableDataSource(dividends);
      this.gridData.sort = this.sort;

      this.refreshKpis(dividends);
    });
  }

  onFilter() {
    if (this.filterCriteria.length > 0 && this.filterCriteria.length < 3)
      return;

    this.gridData.filter = this.filterCriteria.trim().toLowerCase();
    this.refreshKpis(this.gridData.filteredData);
  }

  exportToCsv(matTableExporter : any) {
    matTableExporter.exportTable('csv', { fileName: 'Divs' + this._accountId + "-" + this._year });
  }

  refreshKpis(divs: Dividend[]) {
    this.summaryKPIs.totalDivs = divs.reduce(
      (total, item: Dividend) => total + item.amount,
      0
    );
  }
}
