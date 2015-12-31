function normalizeValue(stdlib, foreign, heap) {
  "use asm";

  function normalizeValue(val, min, rangeChange, from) {
    val = +val;
    min = +min;
    rangeChange = +rangeChange;
    from = +from;
    
    var changed = 0.0;
    
    changed = +(+(val - min) * rangeChange);
    
    // checks if change is NaN
    if (changed != changed) {
        changed = 0.0;
    }
    
    return +(changed + from);
    
    // return (((val - min) * rangeChange) || 0) + from
  }
  
  return normalizeValue;
}
