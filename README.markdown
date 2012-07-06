emcee.js
========

This a Javascript implementation of [emcee](http://danfm.ca/emcee).

Usage
-----

1. Write down the density that you want to sample:
         var lnprobfn = function (x) {
             var i, result = 0.0;
             for (i = 0; i < x.length; i++) result -= 0.5 * x[i] * x[i];
             return result;
         };

2. Initialize an `EnsembleSampler` object:
         var sampler = new emcee.EnsembleSampler(lnprobfn);

3. Make an initial guess at positions for 100 walkers in 3 dimensions,
   in this particular case, it's going to be a small Gaussian ball:
         var initialPosition = emcee.smallBall(100, [0.1, 2, -0.5],
                                                    [1.0, 0.1, 0.5]);

3. Run the heck out of it and take 1000 samples:
         sampler.runMCMC(initialPosition, 1000);

4. The acceptance fraction is `sampler.acceptanceFraction` and the chain
   is stored in `sampler.chain`.

5. Now make some sort of sick front end!

Example
-------

You can also run an example using the `emceeTest` function. Look at the
source code...
