# Grid Spot Algorithm Trading

Grid trading model for algorithmic trading.

The released code is written in Pine Script language for Trading View (Version 5). The script is set up as a strategy, giving you the ability to backtest all markets. You can easily turn it into an indicator by removing the market entry and exit functions. 

This is a long only strategy for spot assets.

# HOW IT WORKS
Grid trading is a trading strategy where an investor creates a so-called "price grid". The basic idea of the strategy is to repeatedly buy at the pre-specified price and then wait for the price to rise above that level and then sell the position (and vice versa with shorting or hedging).

![Schermata 2022-09-05 alle 20 12 16](https://user-images.githubusercontent.com/100917872/188499241-48b30ff8-4b87-42f7-a4cc-aee1bbe30ebd.png)

# FEATURES
1) Grids: This algorithm has a total of 10 grids.
2) Take profit: The trader can increase or decrease the distance between the grids from the User Interface panel, the distance between one grid and another represents the take profit.
3) Management: The algorithm buys 10% of the capital every time the price breaks down a grid and sells during a rise to the next higher grid. The initial capital is invested in 10 sizes which represent 10% of the capital per trade.
4) Stop Loss: The algorithm knows no stop loss as long as it is not activated from the User Interface panel. By activating the stop loss from the User Interface panel the algorithm will insert a close condition on all trades which will be calculated from the last lower grid.
6) Trades: Trades are opened only if the price is within the grid. If the market leaves the grid the algorithm will not buy new positions or sell new positions.
7) Optimal market conditions: The favorable market for this algorithm is the sideways market.

# MODEL'S LIMITATION
The trader must take into account that this is a static model. It only works perfectly well if the market is in a sideways trend and incurs heavy losses if the market takes a bearish trend. The model is unusable for an bull trend. The trader must therefore carefully analyze the market where he intends to use this strategy, making sure that the price is in a sideways trend.

# USES
Indispensable research and backtesting tool for those using bots for their investments. The algorithm produces a backtesting of the strategy for past history. It is used by professional traders to understand if this strategy has been profitable on a market and what parameters to use for bots using this strategy (Kucoin, Binance etc.).


# SET UP 
1) Copy the code 
2) Paste the code on your Pine editor console 
3) Save 
4) Run 

# New Releases 5-11-2022

1. Performance bug fix: the strategy had several output issues. The Trading View performance generator was offering an inappropriate calculation for this type of model. Therefore, we integrated a table showing the performance of the strategy correctly.

2. Improved User Interface: we boost the code and created a better user experience. Descriptions and confirmation tabs have been added. Many users experienced difficulty in setting up on the algorithm chart. This update has eliminated this issue definitely.

3. Grid improvement: the design of the grid has been improved, creating a refined design tool. The old grid has been replaced with a new one that has a lighter and more intuitive design.

4. Update of functions that will be deprecated: functions that will be deprecated in future updates of Pine Script have been removed. This will allow everyone to have a super tool that will run with any problem during next Pine Script updates.
