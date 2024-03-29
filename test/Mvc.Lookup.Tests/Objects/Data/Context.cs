﻿using Microsoft.Data.Entity;

namespace NonFactors.Mvc.Lookup.Tests.Objects.Data
{
    public class Context : DbContext
    {
        public DbSet<TestModel> TestModels { get; set; }
        public DbSet<TestRelationModel> TestRelationModels { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseSqlServer(@"Server=(localdb)\mssqllocaldb;Database=Mvc6LookupTest;Trusted_Connection=True;MultipleActiveResultSets=True");
        }
    }
}
