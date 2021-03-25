import {
  Component,
  OnInit,
  Input,
  AfterViewInit,
  ViewChild,
} from '@angular/core';

import { StockmonService } from '../stockmon.service';
import { HoldingSummary, Holding } from '../viewModel/holdingSummary';
import { asPercent, asCurrency } from '../utilities';

import { BigNumber } from 'bignumber.js';
import * as _ from 'lodash';
import * as moment from 'moment';

import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'mx-holdings',
  templateUrl: './holdings.component.html',
  styleUrls: ['./holdings.component.css'],
})
export class HoldingsComponent implements OnInit, AfterViewInit {
  private _viewLoaded: boolean = false;
  private _accountId: number = -1;

  holdingsSummary: any;
  holdingsSummaryColumns: string[] = [
    'stock',
    'quantity',
    'costPrice',
    'cmp',
    'tco',
    'unrealizedGain',
    'gainPercent',
  ];
  holdingsColumns: string[] = [
    'date',
    'stock',
    'quantity',
    'costPrice',
    'cmp',
    'tco',
    'unrealizedGain',
    'type',
    'gainPercent',
    'cagr',
    'age',
    'notes',
  ];

  holdingGroupings: string[] = ['None', 'Stock'];
  selectedGrouping = this.holdingGroupings[0];

  gridColumns: string[] = [];
  gridData: any;
  @ViewChild(MatSort) sort: MatSort;

  holdingKPIs: { totalCost: number; totalGain: number } = {
    totalCost: 1,
    totalGain: 0,
  };
  holdingsGroupedByStock: HoldingSummary[] = [];
  holdings: Holding[] = [];
  filterCriteria: string = '';

  @Input()
  set accountId(id: number) {
    this._accountId = id;

    if (!this._viewLoaded) {
      return;
    }

    this.refreshGrid();
  }

  constructor(private stockService: StockmonService) {}

  ngAfterViewInit(): void {
    this._viewLoaded = true;

    this.refreshGrid();
  }

  ngOnInit(): void {}

  refreshGrid() {
    this.stockService
      .getHoldings(this._accountId)
      .then((holdings: any) => {
        let stocks = _.chain(holdings).keys().sort().value();

        this.stockService.getQuotes(stocks).then((quotes: any) => {
          this.holdingsGroupedByStock = _.map(stocks, (stock) => {
            let info = holdings[stock],
              costPrice = new BigNumber(info['avg-price']),
              marketPrice = new BigNumber(quotes[stock]),
              gain = marketPrice.minus(costPrice),
              gainPercent = 0;

            if (info['avg-price'] > 0) {
              gainPercent = asPercent(
                marketPrice.minus(costPrice).div(costPrice)
              );
            }

            return {
              stock: stock,
              quantity: info['total-qty'],
              averagePrice: asCurrency(costPrice),
              cmp: asCurrency(marketPrice),
              tco: asCurrency(costPrice.times(info['total-qty'])),
              unrealizedGain: asCurrency(
                gain.times(new BigNumber(info['total-qty']))
              ),
              gainPercent: gainPercent,
            };
          });

          // summary kpi
          let today = moment();

          this.holdings = _.chain(stocks)
            .flatMap((stock) => {
              let stockInfo = holdings[stock];

              return _.map(stockInfo['buys'], (h) => {
                let costPrice = new BigNumber(h['price']),
                  marketPrice = new BigNumber(quotes[stock]),
                  qty = new BigNumber(h['qty']),
                  tco = costPrice.times(qty),
                  gain = marketPrice.minus(costPrice).times(qty),
                  gainPercent = 0,
                  cagr = 0,
                  ageInDays = today.diff(moment(h['date']), 'days');

                if (h.price > 0) {
                  gainPercent = asPercent(
                    new BigNumber(quotes[stock]).minus(h.price).div(h.price)
                  );
                }

                if (h.price > 0 && ageInDays > 30) {
                  cagr = asPercent(
                    this._getCagr(quotes[stock], h.price, ageInDays / 365)
                  );
                }

                return {
                  date: h['date'],
                  stock: stock,
                  quantity: h['qty'],
                  averagePrice: asCurrency(costPrice),
                  cmp: asCurrency(marketPrice),
                  tco: asCurrency(tco),
                  unrealizedGain: asCurrency(gain),
                  notes: h['notes'],
                  type:
                    ageInDays > 365
                      ? 'LONG'
                      : ageInDays > 270
                      ? 'ALMOST'
                      : 'SHORT',
                  age: ageInDays,
                  gainPercent: gainPercent,
                  cagr: cagr,
                };
              });
            })
            .value();

          this.onGroupingChange('None');
        });
      })
      .catch((err) => console.log);
  }

  onGroupingChange(grouping: string) {
    this.selectedGrouping = grouping;

    if (grouping === 'Stock') {
      this.gridData = new MatTableDataSource(this.holdingsGroupedByStock);
      this.gridColumns = this.holdingsSummaryColumns;
    } else {
      this.gridData = new MatTableDataSource(this.holdings);
      this.gridColumns = this.holdingsColumns;
    }
    this.gridData.sort = this.sort;
    this.onFilter();
  }

  onFilter() {
    if (this.filterCriteria.length > 0 && this.filterCriteria.length < 3)
      return;

    this.gridData.filter = this.filterCriteria.trim().toLowerCase();
    this.refreshKpis(this.gridData.filteredData);
  }

  refreshKpis(rows: any[]) {
    let summary = { totalCost: new BigNumber(0), totalGain: new BigNumber(0) };

    summary = _.reduce(
      rows,
      function (acc: any, row) {
        acc.totalCost = acc.totalCost.plus(
          new BigNumber(row.averagePrice).times(row.quantity)
        );
        acc.totalGain = acc.totalGain.plus(new BigNumber(row.unrealizedGain));
        return acc;
      },
      summary
    );

    this.holdingKPIs = {
      totalCost: asCurrency(summary.totalCost),
      totalGain: asCurrency(summary.totalGain),
    };
  }

  private _getCagr(curPrice: number, costPrice: number, ageInYears: number) {
    let cagr =
      Math.pow(
        new BigNumber(curPrice).div(costPrice).toNumber(),
        1 / ageInYears
      ) - 1;
    return new BigNumber(cagr.toPrecision(10));
  }

  getColorCode(row: any) {
    if (this.selectedGrouping === 'Stock')
      return {
        nafaa: row.gainPercent > 0.5,
        nuksaan: row.gainPercent < -0.25,
      };
    else
      return {
        nafaa: row.cagr > 0.25,
        nuksaan: row.cagr < -0.15 && row.age > 90,
      };
  }

  exportToCsv(matTableExporter : any) {
    matTableExporter.exportTable('csv', { fileName: 'Holdings-' + this._accountId });
  }
}
