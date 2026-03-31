import React from 'react';
import { Tag } from '@prisma/client';

type Props = {
  subAccountId: string;
  getSelectedTags: (tags: Tag[]) => void;
  defaultTags: Tag[];
};

const TagCreator = ({ subAccountId, getSelectedTags, defaultTags }: Props) => {
  return <div>TagCreator</div>;
};

export default TagCreator;
