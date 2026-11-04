//+------------------------------------------------------------------+
//| DETwal_Master_Demo.mq5                                           |
//| Demo-only master snapshot publisher.                            |
//+------------------------------------------------------------------+
#property strict
#property version   "0.10"
#property description "DETwal demo-only master position publisher"

input int InpPublishIntervalSeconds = 1;
input string InpSnapshotFolder = "DETwal";
input string InpSnapshotFile = "master_positions.csv";

bool IsDemoAccount()
{
   return ((ENUM_ACCOUNT_TRADE_MODE)AccountInfoInteger(ACCOUNT_TRADE_MODE) == ACCOUNT_TRADE_MODE_DEMO);
}

bool PublishSnapshot()
{
   if(!IsDemoAccount())
   {
      Print("DETwal MASTER: blocked — this EA is demo-only.");
      return false;
   }

   string path = InpSnapshotFolder + "\\" + InpSnapshotFile;
   ResetLastError();
   int handle = FileOpen(path, FILE_WRITE|FILE_CSV|FILE_COMMON|FILE_SHARE_READ, ';');
   if(handle == INVALID_HANDLE)
   {
      PrintFormat("DETwal MASTER: cannot open snapshot file. Error=%d", GetLastError());
      return false;
   }

   int total = PositionsTotal();
   FileWrite(handle, "DETWAL1", (long)TimeLocal(), total);
   int published = 0;

   for(int i = 0; i < total; i++)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0)
         continue;

      string symbol = PositionGetString(POSITION_SYMBOL);
      long identifier = PositionGetInteger(POSITION_IDENTIFIER);
      ENUM_POSITION_TYPE type = (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);
      double volume = PositionGetDouble(POSITION_VOLUME);
      double open_price = PositionGetDouble(POSITION_PRICE_OPEN);
      double sl = PositionGetDouble(POSITION_SL);
      double tp = PositionGetDouble(POSITION_TP);

      FileWrite(handle,
                (string)identifier,
                symbol,
                (int)type,
                DoubleToString(volume, 4),
                DoubleToString(open_price, (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS)),
                DoubleToString(sl, (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS)),
                DoubleToString(tp, (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS)));
      published++;
   }

   FileFlush(handle);
   FileClose(handle);
   PrintFormat("DETwal MASTER: published %d open position(s).", published);
   return true;
}

int OnInit()
{
   if(!IsDemoAccount())
   {
      Print("DETwal MASTER: attach this prototype to a DEMO account only.");
      return INIT_FAILED;
   }
   FolderCreate(InpSnapshotFolder, FILE_COMMON);
   int interval = (InpPublishIntervalSeconds < 1 ? 1 : InpPublishIntervalSeconds);
   EventSetTimer(interval);
   PublishSnapshot();
   Print("DETwal MASTER: demo snapshot publisher started.");
   return INIT_SUCCEEDED;
}

void OnTimer()
{
   PublishSnapshot();
}

void OnDeinit(const int reason)
{
   EventKillTimer();
   Print("DETwal MASTER: stopped.");
}
