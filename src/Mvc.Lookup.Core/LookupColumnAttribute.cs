﻿using System;

namespace NonFactors.Mvc.Lookup
{
    public class LookupColumnAttribute : Attribute
    {
        public Int32? Position { get; set; }
        public String Relation { get; set; }
        public String Format { get; set; }

        public LookupColumnAttribute()
        {
        }
        public LookupColumnAttribute(Int32 position)
        {
            Position = position;
        }
    }
}
