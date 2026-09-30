const path = require("node:path");
const { Stack, Duration, Tags } = require("aws-cdk-lib/core");
const lambda = require("aws-cdk-lib/aws-lambda");
const apigw = require("aws-cdk-lib/aws-apigateway");

class AwsCoderhouseStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const saludo = new lambda.Function(this, "AwsCoderhouseSaludo", {
      runtime: lambda.Runtime.NODEJS_24_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "..", "lambda")),
      timeout: Duration.seconds(10),
    });

    new apigw.LambdaRestApi(this, "ApiSaludo", { handler: saludo });
    Tags.of(this).add("Project", "aws-coderhouse");
  }
}

module.exports = { AwsCoderhouseStack };
