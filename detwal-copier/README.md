# DETwal Copier — demo prototype

## Status
This is a **demo-only prototype**, not a production trade copier. Both EAs refuse to operate on non-demo MT5 accounts. It uses MT5's shared Files\Common folder to exchange a master-position snapshot between terminals running on the same Windows machine.

## Architecture

```text
Master MT5 terminal
  DETwal_Master_Demo.mq5
        |
        | writes snapshot every second
        v
MT5 Common\Files\DETwal\master_positions.csv
        |
        | follower polls snapshot
        v
Follower MT5 terminal(s)
  DETwal_Follower_Demo.mq5
        |
        | demo-only orders / SL-TP updates / closes
        v
Follower account positions
```

This first milestone deliberately avoids a network service and does not collect or store account passwords. It is suitable only for testing two or more MT5 terminals on the same Windows host. It is not yet connected to Supabase or the DETwal dashboard.

## Files
- `MQL5/Experts/DETwal_Master_Demo.mq5`: publishes open master positions.
- `MQL5/Experts/DETwal_Follower_Demo.mq5`: mirrors market positions, SL/TP changes and closes.
- Snapshot location: `Terminal\Common\Files\DETwal\master_positions.csv`.

## Demo setup
1. Open MetaTrader 5 on a Windows demo account.
2. In each terminal, use **File → Open Data Folder**, then open `MQL5/Experts`.
3. Copy the two EA files into the Experts folder (master EA into the master terminal; follower EA into each follower terminal).
4. Compile each file in MetaEditor.
5. Attach the master EA to one chart on the master demo terminal.
6. Attach the follower EA to one chart on each follower demo terminal.
7. Keep all terminals running on the same Windows machine. Enable Algo Trading.
8. Open a small demo position on the master. Check that each follower receives it, updates stops, and closes when the master position disappears.

## Prototype limitations
- Demo accounts only; code checks the MT5 trade mode and refuses live/contest accounts.
- Shared local Common Files folder only; terminals must run on the same Windows host.
- Market positions only; pending orders are not copied.
- Follower prototype requires a hedging-mode demo account; netting mode is rejected to avoid mixing copied positions with other trades.
- The snapshot header includes the expected position count; incomplete reads are rejected so the follower does not act on a truncated snapshot.
- Initial prototype supports open, SL/TP modification and full close. Partial-close/volume-resize, symbol mapping, per-follower sizing, account risk limits, robust queueing, reconnect replay, and server/dashboard sync are future milestones.
- The snapshot is polled once per second. This is not guaranteed low-latency execution.
- If the master snapshot is missing or older than 30 seconds, the follower does nothing and will not close trades based on stale data.
- Test with demo accounts and tiny volumes only. No live deployment until code review, failure testing, security review and each broker/prop firm's written permission for third-party copying/account management.

## Next milestones
1. Add durable event IDs, acknowledgement and idempotent execution.
2. Add partial close, volume changes, symbol aliases and follower-specific lot/risk controls.
3. Add authenticated server relay (master publishes; followers poll/subscribe) with short-lived device credentials. Never embed Supabase service-role keys or MT5 passwords in EA source.
4. Persist follower execution reports and trade/deal history in Supabase with strict per-user RLS.
5. Display each user's own accounts, open P&L and closed trades in the DETwal dashboard.

## Safety
This prototype is educational software. It is not financial advice and makes no promise about fills, slippage, profitability or account-rule compliance. Do not use it on live funds.
