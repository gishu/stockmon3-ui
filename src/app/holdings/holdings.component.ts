import { Component, OnInit, Input, AfterViewInit } from '@angular/core';

import { StockmonService } from '../stockmon.service';
import { HoldingSummary } from '../viewModel/holdingSummary';

import { BigNumber } from 'bignumber.js';
import * as _ from 'lodash';

@Component({
  selector: 'mx-holdings',
  templateUrl: './holdings.component.html',
  styleUrls: ['./holdings.component.css'],
})
export class HoldingsComponent implements OnInit, AfterViewInit {
  private _viewLoaded: boolean = false;
  private _accountId: number = -1;
  private _year: number = -1;

  holdingsSummary: any;
  holdingsSummaryColumns: string[] = [
    'stock',
    'quantity',
    'costPrice',
    'cmp',
    'unrealizedGain',
  ];
  holdingsColumns: string[] = [
    'date',
    'stock',
    'quantity',
    'costPrice',
    'cmp',
    'unrealizedGain',
    'notes',
  ];

  holdingGroupings : string[] = ["None", "Month"];
  selectedGrouping = this.holdingGroupings[0];

  gridColumns :string[] = [];
  gridData : any[] =  [];

  holdingKPIs: { totalCost: number; totalGain: number } = {totalCost: 1, totalGain:0};
  holdingsGroupedByStock: { stock: string; quantity: any; averagePrice: number; cmp: number; unrealizedGain: number; }[] = [];
  holdings: { date: any; stock: string; quantity: any; averagePrice: number; cmp: number; unrealizedGain: number; notes: any; }[] = [];

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
              gain = marketPrice.minus(costPrice);
            return {
              stock: stock,
              quantity: info['total-qty'],
              averagePrice: this.asCurrency(costPrice),
              cmp: this.asCurrency(marketPrice),
              unrealizedGain: this.asCurrency(
                gain.times(new BigNumber(info['total-qty']).div(1000))
              ),
            };
          });

          let totalCost = new BigNumber(0),
            totalGain = new BigNumber(0);

          this.holdings = _.chain(stocks)
            .flatMap((stock) => {
              let stockInfo = holdings[stock];
              return _.map(stockInfo['buys'], (h) => {
                let costPrice = new BigNumber(h['price']),
                  marketPrice = new BigNumber(quotes[stock]),
                  qty = new BigNumber(h['qty']),
                  gain = marketPrice
                    .minus(costPrice)
                    .times(qty);

                totalCost = totalCost.plus(costPrice.times(qty));
                totalGain = totalGain.plus(gain);

                return {
                  date: h['date'],
                  stock: stock,
                  quantity: h['qty'],
                  averagePrice: this.asCurrency(costPrice),
                  cmp: this.asCurrency(marketPrice),
                  unrealizedGain: this.asCurrency(gain),
                  notes: h['notes'],
                };
              });
            })
            .value();

          this.holdingKPIs = {
            totalCost: this.asCurrency(totalCost.div(1000)),
            totalGain: this.asCurrency(totalGain.div(1000)),
          };

          this.onGroupingChange("None");
          
        });
      })
      .catch((err) => console.log);
  }

  onGroupingChange(grouping : string){
    if (grouping === "Month"){
      this.gridData = this.holdingsGroupedByStock;
      this.gridColumns = this.holdingsSummaryColumns;
    } else {
      this.gridData = this.holdings;
      this.gridColumns = this.holdingsColumns;
    }
  }

  asCurrency(number: any) {
    let value: BigNumber;
    if (!(number instanceof BigNumber)) {
      value = new BigNumber(number);
    } else {
      value = number;
    }
    return value.decimalPlaces(2).toNumber();
  }
}
