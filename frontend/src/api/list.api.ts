import {environment} from "@/environments/environment.dev";
import Vue from "vue";
import ListModel from "@/models/list.model";

const getListList = (params = {}) => {
    return Vue.http.get(environment.list, {params});
};

const createList = (listForm: Partial<ListModel>) => {
    return Vue.http.post(environment.list, listForm);
}

export const listService = {
    getListList,
    createList,
};