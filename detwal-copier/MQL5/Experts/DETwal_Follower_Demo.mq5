//+------------------------------------------------------------------+
//| DETwal_Follower_Demo.mq5                                         |
//| Demo-only follower snapshot consumer.                            |
//+------------------------------------------------------------------+
#property strict
#property version   "0.10"
#property description "DETwal demo-only follower execution prototype"

#include <Trade/Trade.mqh>

input int InpPollIntervalSeconds = 1;
input double InpLotMultiplier = 1.0;
input ulong InpFollowerMagic = 640411;
input int InpMaxDeviationPoints = 30;
input int InpMaxSnapshotAgeSeconds = 30;
input string InpSnapshotFolder = "DETwal";
input string InpSnapshotFile = "master_positions.csv";

CTrade trade;
long g_master_ids[];
string g_symbols[];
int g_types[];
double g_volumes[];
double g_sls[];
double g_tps[];

bool IsDemoAccount()
{
   return ((ENUM_ACCOUNT_TRADE_MODE)AccountInfoInteger(ACCOUNT_TRADE_MODE) == ACCOUNT_TRADE_MODE_DEMO);
}

bool HasMasterId(const long id)
{
   for(int i=0; i<ArraySize(g_master_ids); i++)
      if(g_master_ids[i] == id)
         return true;
   return false;
}

int FindFollowerPosition(const long master_id)
{
   string wanted = "DW:" + (string)master_id;
   for(int i=0; i<PositionsTotal(); i++)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0)
         continue;
      if((ulong)PositionGetInteger(POSITION_MAGIC) != InpFollowerMagic)
         continue;
      if(PositionGetString(POSITION_COMMENT) == wanted)
         return (int)i;
   }
   return -1;
}

double NormalizeVolume(const string symbol, double volume)
{
   double minv = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MIN);
   double maxv = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MAX);
   double step = SymbolInfoDouble(symbol, SYMBOL_VOLUME_STEP);
   if(step <= 0.0)
      return 0.0;

   volume = MathMax(minv, MathMin(maxv, volume));
   volume = MathFloor(volume / step + 1e-8) * step;
   int digits = 2;
   if(step >= 1.0) digits = 0;
   else if(step >= 0.1) digits = 1;
   else if(step >= 0.01) digits = 2;
   else if(step >= 0.001) digits = 3;
   else digits = 4;
   return NormalizeDouble(volume, digits);
}

bool LoadSnapshot()
{
   ArrayResize(g_master_ids, 0);
   ArrayResize(g_symbols, 0);
   ArrayResize(g_types, 0);
   ArrayResize(g_volumes, 0);
   ArrayResize(g_sls, 0);
   ArrayResize(g_tps, 0);

   string path = InpSnapshotFolder + "\\" + InpSnapshotFile;
   ResetLastError();
   int h = FileOpen(path, FILE_READ|FILE_CSV|FILE_COMMON|FILE_SHARE_READ|FILE_SHARE_WRITE, ';');
   if(h == INVALID_HANDLE)
   {
      PrintFormat("DETwal FOLLOWER: snapshot unavailable. Error=%d", GetLastError());
      return false;
   }

   string version = FileReadString(h);
   string stamp_text = FileReadString(h);
   string count_text = FileReadString(h);
   long stamp = (long)StringToInteger(stamp_text);
   int expected_count = (int)StringToInteger(count_text);
   if(version != "DETWAL1" || stamp <= 0 || expected_count < 0 || (TimeLocal() - (datetime)stamp) > InpMaxSnapshotAgeSeconds)
   {
      FileClose(h);
      Print("DETwal FOLLOWER: invalid or stale snapshot; no action taken.");
      return false;
   }

   while(!FileIsEnding(h))
   {
      string id_text = FileReadString(h);
      if(id_text == "")
         break;
      string symbol = FileReadString(h);
      string type_text = FileReadString(h);
      string volume_text = FileReadString(h);
      string open_text = FileReadString(h); // reserved for dashboard/reporting
      string sl_text = FileReadString(h);
      string tp_text = FileReadString(h);

      long id = (long)StringToInteger(id_text);
      if(id <= 0 || symbol == "")
         continue;

      int n = ArraySize(g_master_ids);
      ArrayResize(g_master_ids, n+1);
      ArrayResize(g_symbols, n+1);
      ArrayResize(g_types, n+1);
      ArrayResize(g_volumes, n+1);
      ArrayResize(g_sls, n+1);
      ArrayResize(g_tps, n+1);
      g_master_ids[n] = id;
      g_symbols[n] = symbol;
      g_types[n] = (int)StringToInteger(type_text);
      g_volumes[n] = StringToDouble(volume_text);
      g_sls[n] = StringToDouble(sl_text);
      g_tps[n] = StringToDouble(tp_text);
   }
   FileClose(h);
   if(ArraySize(g_master_ids) != expected_count)
   {
      PrintFormat("DETwal FOLLOWER: incomplete snapshot (%d/%d records); no action taken.", ArraySize(g_master_ids), expected_count);
      return false;
   }
   return true;
}

void SyncOpenPositions()
{
   for(int i=0; i<ArraySize(g_master_ids); i++)
   {
      long master_id = g_master_ids[i];
      string symbol = g_symbols[i];
      if(!SymbolSelect(symbol, true))
      {
         PrintFormat("DETwal FOLLOWER: symbol unavailable: %s", symbol);
         continue;
      }

      int existing = FindFollowerPosition(master_id);
      string comment = "DW:" + (string)master_id;
      double sl = g_sls[i];
      double tp = g_tps[i];

      if(existing >= 0)
      {
         ulong ticket = PositionGetTicket(existing);
         if(ticket > 0)
         {
            double old_sl = PositionGetDouble(POSITION_SL);
            double old_tp = PositionGetDouble(POSITION_TP);
            if(MathAbs(old_sl-sl) > _Point || MathAbs(old_tp-tp) > _Point)
            {
               if(!trade.PositionModify(ticket, sl, tp))
                  PrintFormat("DETwal FOLLOWER: SL/TP update failed for %I64u: %s", ticket, trade.ResultRetcodeDescription());
            }
         }
         continue;
      }

      double volume = NormalizeVolume(symbol, g_volumes[i] * InpLotMultiplier);
      if(volume <= 0.0)
      {
         PrintFormat("DETwal FOLLOWER: invalid normalized volume for %s", symbol);
         continue;
      }

      bool sent = false;
      if(g_types[i] == (int)POSITION_TYPE_BUY)
         sent = trade.Buy(volume, symbol, 0.0, sl, tp, comment);
      else if(g_types[i] == (int)POSITION_TYPE_SELL)
         sent = trade.Sell(volume, symbol, 0.0, sl, tp, comment);

      if(!sent)
         PrintFormat("DETwal FOLLOWER: open failed for master %I64d: %s", master_id, trade.ResultRetcodeDescription());
      else
         PrintFormat("DETwal FOLLOWER: copied master %I64d on %s; order=%I64u", master_id, symbol, trade.ResultOrder());
   }
}

void CloseOrphanedPositions()
{
   // Only close positions created by this EA. This requires a fresh,
   // valid master snapshot; stale/missing snapshots never reach this function.
   for(int i=PositionsTotal()-1; i>=0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0 || (ulong)PositionGetInteger(POSITION_MAGIC) != InpFollowerMagic)
         continue;

      string comment = PositionGetString(POSITION_COMMENT);
      if(StringFind(comment, "DW:") != 0)
         continue;

      long master_id = (long)StringToInteger(StringSubstr(comment, 3));
      if(master_id > 0 && !HasMasterId(master_id))
      {
         if(!trade.PositionClose(ticket))
            PrintFormat("DETwal FOLLOWER: close failed for %I64u: %s", ticket, trade.ResultRetcodeDescription());
         else
            PrintFormat("DETwal FOLLOWER: closed orphaned copied position %I64u", ticket);
      }
   }
}

void ProcessSnapshot()
{
   if(!IsDemoAccount())
   {
      Print("DETwal FOLLOWER: blocked — this EA is demo-only.");
      return;
   }
   if(!LoadSnapshot())
      return;

   SyncOpenPositions();
   CloseOrphanedPositions();
}

int OnInit()
{
   if(!IsDemoAccount())
   {
      Print("DETwal FOLLOWER: attach this prototype to a DEMO account only.");
      return INIT_FAILED;
   }
   if((ENUM_ACCOUNT_MARGIN_MODE)AccountInfoInteger(ACCOUNT_MARGIN_MODE) != ACCOUNT_MARGIN_MODE_RETAIL_HEDGING)
   {
      Print("DETwal FOLLOWER: this prototype requires a HEDGING demo account. Netting mode is not supported.");
      return INIT_FAILED;
   }
   trade.SetExpertMagicNumber(InpFollowerMagic);
   trade.SetDeviationInPoints(InpMaxDeviationPoints);
   trade.SetAsyncMode(false);
   int interval = (InpPollIntervalSeconds < 1 ? 1 : InpPollIntervalSeconds);
   EventSetTimer(interval);
   ProcessSnapshot();
   Print("DETwal FOLLOWER: demo snapshot consumer started.");
   return INIT_SUCCEEDED;
}

void OnTimer()
{
   ProcessSnapshot();
}

void OnDeinit(const int reason)
{
   EventKillTimer();
   Print("DETwal FOLLOWER: stopped.");
}
