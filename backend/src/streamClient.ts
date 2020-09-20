import StreamServer from "./streamServer";
import msgpack from "msgpack-lite";
import { MethodType, Method } from "./common/constants";

export default class StreamClient {
  ws: any;
  server: StreamServer;

  constructor(server: any, ws: any) {
    this.ws = ws;
    this.server = server;

    this.ws.on("message", (message: any) => {
      try {
        console.dir(msgpack.decode(message));
        this.messageHandler(msgpack.decode(message));
      } catch (err) {
        console.log(`message error: ${JSON.stringify(message)}`);
      }
    });

    this.ws.on("close", () => {
      // this.server.privateDataUnsub('orderBook', this);
      this.server.privateDataUnsub(Method.subscribeMarket, this);
      this.server.privateDataUnsub(Method.subscribeOrderBook, this);
      console.log("disconnected client..");
    });
  }

  sendMessage(methodType: MethodType, method: any, data: any) {
    const option = {
      methodType,
      method,
      data
    };

    // this.ws.send(new Uint8Array(msgpack.encode(option)));
    this.ws.send(JSON.stringify(option));
  }

  messageHandler(message: any) {
    console.dir(`received: ${JSON.stringify(message)}`);
    const type = message.type;
    const method = message.method;
    const params = message.params;

    switch (type) {
      case MethodType.subscribe: {
        switch (method) {
          case Method.subscribeMarket: {
            this.sendMessage(type, method, this.server.getMarketList());
            this.server.privateDataSub(method, this, undefined);
            break;
          }
          case Method.subscribeOrderBook: {
            const markets = params.market.split("/");
            const test = this.server.getOrderBook(markets[0], markets[1]);
            this.sendMessage(type, method, this.server.getOrderBook(markets[0], markets[1]));
            this.server.privateDataSub(method, this, (param: any) => {
              return param.market === params.market;
            });
            break;
          }
        }
        break;
      }
      case MethodType.unsubscribe: {
        break;
      }
      case MethodType.call: {
        break;
      }
    }
  }
}