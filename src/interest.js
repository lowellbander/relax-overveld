class Interest {
  constructor(name, lifetime) {
    this.name = name instanceof Name ? name : new Name(name);
    this.lifetime = lifetime || 2;
    this.hopCount = 0;
  };

  getPrefix() {
    return this.name;
  };

  setPrefix(name) {
    this.name = name instanceof Name ? name : new Name(name);
  };

  getLifeTime() {
    return this.lifetime;
  }

  setLifeTime(lifetime) {
    this.lifetime = lifetime;
  };

  getHopCount() {
    return this.hopCount;
  }

  incrementHopCount() {
    this.hopCount = this.hopCount + 1;
  }
}
