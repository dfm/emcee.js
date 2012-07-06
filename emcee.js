//
//
// emcee.js
// Dan Foreman-Mackey
// https://github.com/dfm/emcee.js
//

var emceeTest = function () {
    // An example of how one might use `emcee.js` for sampling. Czech it out!
    var lnprobfn, sampler, initialPosition, means, sigmas, i, dim, N = 5000;

    console.log("Testing emcee...");

    // Define the density.
    lnprobfn = function (x) {
        var i, result = 0.0;
        for (i = 0; i < x.length; i++) result -= 0.5 * x[i] * x[i];
        return result;
    };

    // Take a dumb-ass guess at the initial position.
    dim = 50;
    means = new Array();
    sigmas = new Array();
    for (i = 0; i < dim; i++) {
        means[i] = 10 * Math.random() - 5;
        sigmas[i] = 4 * Math.random() - 2;
    }
    initialPosition = emcee.smallBall(100, means, sigmas);

    // Runs the sampler.
    console.log("Sampling a " + dim + " dimensional Gaussian for " + N
            + " steps...");
    sampler = new emcee.EnsembleSampler(lnprobfn);
    sampler.runMCMC(initialPosition, N);
    console.log("Done sampling.");
    console.log("The acceptance is "
            + Math.round(100 * sampler.acceptanceFraction) + "\%.");

    return sampler;
};

(function () {
    var EnsembleSampler, Walker, randomNormal, _randNorm, smallBall;

    _randNorm = null;
    randomNormal = function () {
        // Box-Muller transform for normally distributed random numbers.
        // http://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform
        var f, u, v, s = 0.0;
        if (_randNorm !== null && typeof(_randNorm) !== "undefined") {
            var tmp = _randNorm;
            _randNorm = null;
            return tmp;
        }
        while (s === 0.0 || s >= 1.0) {
            u = 2 * Math.random() - 1;
            v = 2 * Math.random() - 1;
            s = u * u + v * v;
        }
        f = Math.sqrt(-2 * Math.log(s) / s);
        _randNorm = v * f;
        return u * f;
    };

    smallBall = function (nWalkers, mean, sigmas) {
        // A helper function for initializing the walkers positions in a small
        // ball in parameters space with mean and sigma vectors.
        var i, k, result = new Array(), ndim = mean.length;

        for (k = 0; k < nWalkers; k++) {
            result[k] = new Array();
            for (i = 0; i < ndim; i++)
                result[k][i] = mean[i] + sigmas[i] * randomNormal();
        }
        return result;
    };

    Walker = function (p0, lnprobfn) {
        // A walker has a position and a log-probability at that position. It
        // can also move to a new position following the rules of this MCMC
        // algorithm.
        this.dim = p0.length;
        this.position = p0;
        this.lnprobfn = lnprobfn;
        this.lnprob = lnprobfn(p0);
    };

    Walker.prototype.update = function (z, pos) {
        // Propose a new position based on the position of another walker and
        // then accept/reject with the correct acceptance probability. This
        // function returns 1 if it accepts and 0 otherwise.
        var i, proposal, newLnProb, deltaLnProb;
        proposal = new Array();
        for (i = 0; i < this.dim; i++)
            proposal[i] = pos[i] - z * (pos[i] - this.position[i]);
        newLnProb = this.lnprobfn(proposal);
        deltaLnProb = (this.dim - 1) * Math.log(z) + newLnProb - this.lnprob
        if (deltaLnProb > Math.log(Math.random())) {
            this.position = proposal;
            this.lnprob = newLnProb;
            return 1;
        }
        return 0;
    };

    EnsembleSampler = function (lnprobfn, a) {
        // This object contains a set of `Walker`s and a log-probability
        // function.
        this.lnprobfn = lnprobfn;
        this.walkers = new Array();
        this.a = 2;
        if (typeof(a) !== "undefined" && a !== null) this.a = a;
    };

    EnsembleSampler.prototype.setup = function (initialPosition) {
        // Given an initial guess for the walker positions, set up the
        // ensemble for sampling.
        var k;

        // How many walkers are there?
        this.nWalkers = initialPosition.length;

        // Set up the chain array for output. This will end up with
        // `iterations` arrays of walker positions.
        this.chain = new Array();
        this.nAccepted = 0;

        // Initialize the walkers.
        for (k = 0; k < this.nWalkers; k++)
            this.walkers[k] = new Walker(initialPosition[k], this.lnprobfn);

        return this;
    };

    EnsembleSampler.prototype.advance = function () {
        // Advance the ensemble of walkers one step.
        var link = new Array();
        for (k = 0; k < this.nWalkers; k++) {
            var z, kp, r;
            z = Math.pow((this.a - 1) * Math.random() + 1, 2) / this.a;

            // Choose another walker.
            kp = Math.round((this.nWalkers - 1) * Math.random() - 0.5);
            if (kp >= k) kp++;

            // Generate the proposal.
            this.nAccepted += this.walkers[k].update(z,
                                                this.walkers[kp].position);
            link[k] = this.walkers[k].position;
        }
        return link;
    };

    EnsembleSampler.prototype.runMCMC = function (initialPosition, iter) {
        // Given an initial guess for the positions of the walkers, run an
        // MCMC for `iterations` steps.
        var i;

        // Set up the ensemble.
        this.setup(initialPosition);

        // Iterate.
        for (i = 0; i < iter; i++) this.chain[i] = this.advance();

        // Calculate the acceptance fraction.

        this.acceptanceFraction = this.nAccepted / iter / this.nWalkers;
        return this.chain;
    };

    EnsembleSampler.prototype.getFlatChain = function () {
        // Get the chain flattened to the shape `(iterations, dimension)`.
        var i, k, result = new Array();
        for (i = 0; i < this.chain.length; i++)
            for (k = 0; k < this.nWalkers; k++)
                result[i * this.nWalkers + k] = this.chain[i][k];
        return result;
    };

    window.emcee = {
        EnsembleSampler: EnsembleSampler,
        smallBall: smallBall,
        randomNormal: randomNormal
    };
})();
