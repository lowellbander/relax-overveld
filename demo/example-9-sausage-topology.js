examples.Nine_Node_Sausage_Topology = function() {
  var p1 = rc.addNode(200,  200);
  var p2 = rc.addNode(300,  200);
  var p3 = rc.addNode(400,  200);
  var p4 = rc.addNode(500,  200);
  var p5 = rc.addNode(600,  200);
  var p6 = rc.addNode(700,  200);
  var p7 = rc.addNode(800,  200);
  var p8 = rc.addNode(900,  200);
  var p9 = rc.addNode(1000, 200);

  rc.addLine(p1, p2);
  rc.addLine(p2, p3);
  rc.addLine(p3, p4);
  rc.addLine(p4, p5);
  rc.addLine(p5, p6);
  rc.addLine(p6, p7);
  rc.addLine(p7, p8);
  rc.addLine(p8, p9);

  rc.addLengthConstraint(p1, p2, 100);
  rc.addLengthConstraint(p2, p3, 100);
  rc.addLengthConstraint(p3, p4, 100);
  rc.addLengthConstraint(p4, p5, 100);
  rc.addLengthConstraint(p5, p6, 100);
  rc.addLengthConstraint(p6, p7, 100);
  rc.addLengthConstraint(p7, p8, 100);
  rc.addLengthConstraint(p8, p9, 100);
};

