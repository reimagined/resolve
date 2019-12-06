import grpc from 'grpc'
import { loadSync as protoloadSync} from '@grpc/proto-loader'

import createCommandExecutor from 'resolve-command'
import createQueryExecutor from 'resolve-query'

const server = new grpc.Server();

server.bind('0.0.0.0:50050', grpc.ServerCredentials.createInsecure());

const proto = protoloadSync('commands.proto');
console.log(proto["employees.EmployeesService"])

server.addService(proto["employees.EmployeesService"], {
  List(call, callback){
    console.log(call)
    callback()
  },

  get(call, callback){
    console.log(call)
    callback()
  },

  Insert(call, callback){
    console.log(call)
    callback()
  },

  remove(call, callback){
    console.log(call)
    callback()
  },
});

client = new mathClient(
  `localhost:${port}`,
  grpc.credentials.createInsecure()
);
server.start();
console.log('grpc server running on port:', '0.0.0.0:50050');


