﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Common
{
    public class Enums
    {
        public enum Genders { Male=0,Female};
        public enum Roles { Driver=0,Customer,Admin}
        public enum TypeOfCar { MiniVan=0,RegularCar}
        public enum DrivingStatus { Created=0,Declined,Formed,Processed,Accepted,Faliled,Succesffull}
    }
}
