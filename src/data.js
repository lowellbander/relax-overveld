class Data {
  constructor(name) {
    this.name = new Name(name);
    this.signature = "";
    this.content = "";
    this.hopCount = 0;
  };

  constructDataWithSig(name, signature) {
    this.name = new Name(name);
    this.signature = signature;
    this.content = "";
    this.hopCount = 0;
  };

  constructDataWithContent(name, content) {
    this.name = new Name(name);
    this.signature = "";
    this.content = content;
    this.hopCount = 0;
  };

  constructDataWithSigAndContent(name, signature, content) {
    this.name = new Name(name);
    this.signature = signature;
    this.content = content;
    this.hopCount = 0;
  };

  getName() {
    return this.name;
  };

  setName(name) {
    this.name = new Name(name);
  };

  getSignature() {
    return this.signature;
  };

  setSignature(signature) {
    this.signature = signature;
  };

  getContent() {
    return this.content;
  };

  setContent(content) {
    this.content = content;
  };

  getHopCount() {
    return this.hopCount;
  };

  setHopCount(hopCount) {
    this.hopCount = hopCount;
  };
}
