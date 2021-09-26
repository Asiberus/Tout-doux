import {environment} from '@/environments/environment.dev';
import {SectionPost} from '@/models/section.model';
import Vue from "vue";

const createSection = (section: SectionPost) => {
  return Vue.http.post(environment.section, section)
};

export const sectionService = {
  createSection
};
