import {environment} from '@/environments/environment.dev';
import {SectionPost} from '@/models/section.model';
import Vue from "vue";

const createSection = (section: SectionPost) => {
  return Vue.http.post(environment.section, section);
};

const updateSection = (id: number, section: { name: string }) => {
  const url = environment.sectionById.replace(':sectionId', id.toString());
  return Vue.http.patch(url, section);
};

const deleteSection = (id: number) => {
  const url = environment.sectionById.replace(':sectionId', id.toString());
  return Vue.http.delete(url);
};

export const sectionService = {
  createSection,
  updateSection,
  deleteSection,
};
