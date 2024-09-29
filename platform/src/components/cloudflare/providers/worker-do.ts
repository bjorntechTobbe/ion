import { CustomResourceOptions, Input, Output, dynamic } from "@pulumi/pulumi";
import { cfFetch } from "../helpers/fetch.js";

interface Inputs {
  accountId: string;
  name: string;
  script: string;
  class: string;
}

interface Outputs {
  id: string;
}

export interface DurableObjectNamespaceInputs {
  accountId: Input<Inputs["accountId"]>;
  name: Input<Inputs["name"]>;
  script: Input<Inputs["script"]>;
  class: Input<Inputs["class"]>;
}

export interface DurableObjectNamespace {
  id: Output<Outputs["id"]>;
}

class Provider implements dynamic.ResourceProvider {
  async create(inputs: Inputs): Promise<dynamic.CreateResult> {
    const namespace = await this.createNamespace(inputs);
    return {
      id: namespace.result.id,
      outs: { id: namespace.result.id },
    };
  }

  async update(
    id: string,
    olds: Inputs,
    news: Inputs
  ): Promise<dynamic.UpdateResult> {
    const namespace = await this.updateNamespace(id, news);
    return {
      outs: { id: namespace.result.id },
    };
  }

  async delete(id: string, inputs: Inputs): Promise<void> {
    await this.deleteNamespace(inputs.accountId, id);
  }

  async createNamespace(inputs: Inputs) {
    try {
      const response = await cfFetch<{ result: { id: string } }>(
        `/accounts/${inputs.accountId}/workers/durable_objects/namespaces`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: inputs.name,
            script: inputs.script,
            class: inputs.class,
          }),
        }
      );
      return response.result;
    } catch (error: any) {
      console.error("Error creating Durable Object namespace:", error);
      throw error;
    }
  }

  async updateNamespace(id: string, inputs: Inputs) {
    try {
      const response = await cfFetch<{ result: { id: string } }>(
        `/accounts/${inputs.accountId}/workers/durable_objects/namespaces/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: inputs.name,
            script: inputs.script,
            class: inputs.class,
          }),
        }
      );
      return response.result;
    } catch (error: any) {
      console.error("Error updating Durable Object namespace:", error);
      throw error;
    }
  }

  async deleteNamespace(accountId: string, id: string) {
    try {
      await cfFetch(
        `/accounts/${accountId}/workers/durable_objects/namespaces/${id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error: any) {
      console.error("Error deleting Durable Object namespace:", error);
      throw error;
    }
  }
}

export class DurableObjectNamespace extends dynamic.Resource {
  constructor(
    name: string,
    args: DurableObjectNamespaceInputs,
    opts?: CustomResourceOptions
  ) {
    super(
      new Provider(),
      `${name}.sst.cloudflare.DurableObjectNamespace`,
      { ...args, id: undefined },
      opts
    );
  }
}
