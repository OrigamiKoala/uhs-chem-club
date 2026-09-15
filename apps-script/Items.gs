/**
 * Items.gs — Inventory management and consumable item activation for Avalon
 */

var Items = {
  useItem: function(playerId, itemId, context) {
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) {
      throw { code: 'BUSY', message: 'Item usage is currently processing. Please try again.' };
    }

    try {
      var itemDef = Db.findOne('Items', function(it) { return it.item_id === itemId; });
      if (!itemDef) throw { code: 'ITEM_NOT_FOUND', message: 'Unknown item.' };

      var inv = Db.findOne('Inventory', function(i) {
        return i.player_id === playerId && i.item_id === itemId && Number(i.qty) > 0;
      });
      if (!inv) throw { code: 'NOT_IN_INVENTORY', message: 'You do not own this item.' };

      var effectResult = { itemId: itemId, success: true, message: '' };

      if (itemDef.effect_code === 'flat_50_xp') {
        var subId = generateId('sub');
        Db.append('Submissions', {
          submission_id: subId,
          ts: isoNow(),
          player_id: playerId,
          quest_id: 'item_use',
          stage_index: 0,
          attempt_no: 1,
          payload_json: JSON.stringify({ item: itemId }),
          correct: 'TRUE',
          xp_awarded: 50,
          elapsed_ms: 0,
          hint_used: 'FALSE',
          gfx_tier: 'T2',
          ip_hash: ''
        });
        effectResult.message = 'Resonance Key activated: +50 XP granted instantly!';
      } else if (itemDef.effect_code === 'free_hint') {
        effectResult.message = 'Hint Chip activated: Free hint ready for your next stage.';
      } else if (itemDef.effect_code === 'restore_attempt') {
        effectResult.message = 'Spare Coolant flushed: Scanner cooldown reset.';
      } else if (itemDef.effect_code === 'reveal_legend') {
        effectResult.message = 'Scanner upgraded: Precision colormap telemetry unlocked.';
      } else {
        effectResult.message = itemDef.name + ' activated successfully.';
      }

      // Decrement inventory
      var newQty = Number(inv.qty) - 1;
      if (newQty <= 0) {
        Db.update('Inventory', function(i) { return i.inv_id === inv.inv_id; }, { qty: 0 });
      } else {
        Db.update('Inventory', function(i) { return i.inv_id === inv.inv_id; }, { qty: newQty });
      }

      Db.append('AuditLog', {
        ts: isoNow(),
        actor: playerId,
        action: 'USE_ITEM',
        target: itemId,
        detail_json: JSON.stringify({ context: context || {}, effectResult: effectResult })
      });

      var updatedInv = Db.find('Inventory', function(i) {
        return i.player_id === playerId && Number(i.qty) > 0;
      });

      return {
        effect: effectResult,
        inventory: updatedInv
      };
    } finally {
      lock.releaseLock();
    }
  }
};
